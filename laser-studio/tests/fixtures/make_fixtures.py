#!/usr/bin/env python3
"""Generates small test models in every supported format. Usage: make_fixtures.py OUT_DIR"""
import json, struct, sys, os, math
from PIL import Image

out = sys.argv[1] if len(sys.argv) > 1 else '.'
os.makedirs(out, exist_ok=True)

def extrude(profile, h):
    """closed prism, z-up. returns (verts, tris)"""
    n = len(profile)
    v = [(x, y, 0) for x, y in profile] + [(x, y, h) for x, y in profile]
    t = []
    for i in range(1, n - 1):
        t.append((0, i + 1, i)); t.append((n, n + i, n + i + 1))
    for i in range(n):
        j = (i + 1) % n
        t.append((i, j, n + j)); t.append((i, n + j, n + i))
    return v, t

# --- STL (binary), L-shaped building, Z-up
v, t = extrude([(0, 0), (60, 0), (60, 20), (20, 20), (20, 50), (0, 50)], 30)
with open(f'{out}/lshape.stl', 'wb') as f:
    f.write(b'lshape'.ljust(80, b' ')); f.write(struct.pack('<I', len(t)))
    for a, b, c in t:
        f.write(struct.pack('<3f', 0, 0, 0))
        for k in (a, b, c): f.write(struct.pack('<3f', *v[k]))
        f.write(b'\0\0')

# --- texture
img = Image.new('RGB', (64, 64))
for y in range(64):
    for x in range(64):
        img.putpixel((x, y), (int(255 * x / 63), int(255 * y / 63), 120 if (x // 8 + y // 8) % 2 else 200))
img.save(f'{out}/tex.png'); img.save(f'{out}/tex.jpg'); img.save(f'{out}/tex.tif')

# --- OBJ + MTL + PNG (textured cube)
cv = [(0,0,0),(1,0,0),(1,1,0),(0,1,0),(0,0,1),(1,0,1),(1,1,1),(0,1,1)]
faces = [(0,3,2,1),(4,5,6,7),(0,1,5,4),(1,2,6,5),(2,3,7,6),(3,0,4,7)]
with open(f'{out}/cube.obj', 'w') as f:
    f.write('mtllib cube.mtl\nusemtl wrap\n')
    for p in cv: f.write('v %f %f %f\n' % p)
    f.write('vt 0 0\nvt 1 0\nvt 1 1\nvt 0 1\n')
    for q in faces: f.write('f ' + ' '.join(f'{i+1}/{k+1}' for k, i in enumerate(q)) + '\n')
open(f'{out}/cube.mtl', 'w').write('newmtl wrap\nKd 1 1 1\nmap_Kd tex.png\n')

# --- GLB (textured box) built by hand
pos, uv, idx = [], [], []
for q in faces:
    base = len(pos)
    for k, i in enumerate(q):
        pos.append(cv[i]); uv.append([(0,1),(1,1),(1,0),(0,0)][k])
    idx += [base, base+1, base+2, base, base+2, base+3]
pb = b''.join(struct.pack('<3f', *p) for p in pos)
ub = b''.join(struct.pack('<2f', *u) for u in uv)
ib = b''.join(struct.pack('<H', i) for i in idx)
ib += b'\0' * ((4 - len(ib) % 4) % 4)
png = open(f'{out}/tex.png', 'rb').read(); png += b' ' * ((4 - len(png) % 4) % 4)
binb = pb + ub + ib + png
gl = {
  'asset': {'version': '2.0'}, 'scene': 0, 'scenes': [{'nodes': [0]}], 'nodes': [{'mesh': 0}],
  'meshes': [{'primitives': [{'attributes': {'POSITION': 0, 'TEXCOORD_0': 1}, 'indices': 2, 'material': 0}]}],
  'materials': [{'pbrMetallicRoughness': {'baseColorTexture': {'index': 0}, 'metallicFactor': 0}}],
  'textures': [{'source': 0}], 'images': [{'bufferView': 3, 'mimeType': 'image/png'}],
  'buffers': [{'byteLength': len(binb)}],
  'bufferViews': [
    {'buffer': 0, 'byteOffset': 0, 'byteLength': len(pb)},
    {'buffer': 0, 'byteOffset': len(pb), 'byteLength': len(ub)},
    {'buffer': 0, 'byteOffset': len(pb) + len(ub), 'byteLength': len(ib)},
    {'buffer': 0, 'byteOffset': len(pb) + len(ub) + len(ib), 'byteLength': len(png)}],
  'accessors': [
    {'bufferView': 0, 'componentType': 5126, 'count': len(pos), 'type': 'VEC3', 'min': [0,0,0], 'max': [1,1,1]},
    {'bufferView': 1, 'componentType': 5126, 'count': len(uv), 'type': 'VEC2'},
    {'bufferView': 2, 'componentType': 5123, 'count': len(idx), 'type': 'SCALAR'}],
}
js = json.dumps(gl).encode(); js += b' ' * ((4 - len(js) % 4) % 4)
glb = struct.pack('<4sII', b'glTF', 2, 12 + 8 + len(js) + 8 + len(binb)) + struct.pack('<I4s', len(js), b'JSON') + js + struct.pack('<I4s', len(binb), b'BIN\0') + binb
open(f'{out}/box.glb', 'wb').write(glb)

# --- ASCII FBX (flat-coloured prism)
v, t = extrude([(0, 0), (40, 0), (40, 20), (20, 35), (0, 20)], 25)
polys = []
for a, b, c in t: polys += [a, b, -c - 1]
fbx = f'''; FBX 7.3.0 project file
FBXHeaderExtension:  {{
\tFBXHeaderVersion: 1003
\tFBXVersion: 7300
}}
Objects:  {{
\tGeometry: 1000, "Geometry::Prism", "Mesh" {{
\t\tVertices: *{len(v)*3} {{
\t\t\ta: {",".join(str(float(c)) for p in v for c in p)}
\t\t}}
\t\tPolygonVertexIndex: *{len(polys)} {{
\t\t\ta: {",".join(map(str, polys))}
\t\t}}
\t\tGeometryVersion: 124
\t}}
\tModel: 2000, "Model::Prism", "Mesh" {{
\t\tVersion: 232
\t\tProperties70:  {{
\t\t}}
\t}}
}}
Connections:  {{
\tC: "OO",1000,2000
\tC: "OO",2000,0
}}
'''
open(f'{out}/prism.fbx', 'w').write(fbx)
open(f'{out}/broken.stl', 'wb').write(b'this is not a model')
open(f'{out}/empty.obj', 'w').write('# nothing here\n')
print('fixtures written to', out)
