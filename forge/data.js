'use strict';
/* FUTURE FORGE AI: injenerlik bilimlar bazasi. Barcha narxlar va vaqtlar taxminiy. */

const CX = ["Past","O'rta","Yuqori","Juda yuqori"];
const ST = {
  current:     {n:"Hozir mumkin", c:"#39ff88"},
  modified:    {n:"Modifikatsiya bilan mumkin", c:"#22d3ee"},
  experimental:{n:"Eksperimental", c:"#ffb020"},
  speculative: {n:"Hozircha spekulyativ", c:"#ff5d73"}
};

/* Mashinalar va kategoriyalar */
const MACH = {
  "Diod lazer (20W)":"LASER","CO2 lazer (60-100W)":"LASER","Fiber lazer":"LASER",
  "CNC router":"CNC","CNC frezer (mill)":"CNC","CNC tokarlik (lathe)":"CNC",
  "FDM 3D printer":"3D","Resin (MSLA) 3D printer":"3D","Sanoat 3D printeri (SLS/MJF/metall)":"3D",
  "Lehim stansiyasi":"ELEKTRONIKA","Osilloskop":"ELEKTRONIKA","Multimetr":"ELEKTRONIKA","PCB ishlab chiqarish (printer yoki servis)":"ELEKTRONIKA",
  "Parma stanogi (drill press)":"FABRIKATSIYA","Bukish mashinasi (press brake)":"FABRIKATSIYA","Payvandlash apparati":"FABRIKATSIYA","Charxlash mashinasi":"FABRIKATSIYA","Silliqlash/jilolash mashinasi":"FABRIKATSIYA","Termoformovka stansiyasi":"FABRIKATSIYA",
  "Aerograf":"SIRT ISHLOVI","Purkash kabinasi (spray booth)":"SIRT ISHLOVI","UV printer":"SIRT ISHLOVI","Gravyura mashinasi":"SIRT ISHLOVI"
};
const MACH_INFO = {
  "Diod lazer (20W)":"Arzon; fanera/karton kesadi va ko'p materialga gravyura qiladi. Shaffof akrilni kesmaydi.",
  "CO2 lazer (60-100W)":"Akril, fanera, MDF, charm, mato kesish va gravyura uchun asosiy ustaxona lazeri.",
  "Fiber lazer":"Metall belgilash/gravyura (ingichka metallni kesish yuqori quvvat bilan).",
  "CNC router":"Yog'och, plastik, yumshoq alyuminiy (kichik chuqurlikda) frezalash.",
  "CNC frezer (mill)":"Alyuminiy va po'latdan aniq detallar; qattiq korpus va bo'g'inlar.",
  "CNC tokarlik (lathe)":"Aylanuvchi detallar: o'qlar, vtulkalar, silindrik korpuslar.",
  "FDM 3D printer":"PLA/PETG/ABS/TPU detallar, prototip korpus, tishli g'ildirak.",
  "Resin (MSLA) 3D printer":"Yuqori aniqlikdagi mayda detallar, optik elementlar uchun qoliplar.",
  "Sanoat 3D printeri (SLS/MJF/metall)":"Nylon (SLS/MJF) va metall detallar; kichik partiya ishlab chiqarish.",
  "Lehim stansiyasi":"Elektron komponentlar va simlarni lehimlash.",
  "Osilloskop":"Signal va quvvat sifatini sinash, nosozlik topish.",
  "Multimetr":"Kuchlanish, tok, uzilishlarni o'lchash.",
  "PCB ishlab chiqarish (printer yoki servis)":"Maxsus platalar: servis (JLCPCB, PCBWay) yoki o'z frezer/printeringiz.",
  "Parma stanogi (drill press)":"Aniq teshiklar ochish.",
  "Bukish mashinasi (press brake)":"List metallni burchak bilan bukish.",
  "Payvandlash apparati":"Po'lat/alyuminiy ramkalarni biriktirish.",
  "Charxlash mashinasi":"Kesish, qirralarni tozalash.",
  "Silliqlash/jilolash mashinasi":"Sirtni silliqlash va jilolash.",
  "Termoformovka stansiyasi":"Plastik listni isitib shakl berish (visor, qobiq).",
  "Aerograf":"Bo'yash, gradiyent va metallik effektlar.",
  "Purkash kabinasi (spray booth)":"Changsiz, xavfsiz bo'yash/lak surtish.",
  "UV printer":"Tekis va shaklli yuzalarga to'g'ridan-to'g'ri rangli bosma.",
  "Gravyura mashinasi":"Yozuv va naqshlarni o'yib tushirish."
};
const TIERS = {
  small: {n:"Kichik ustaxona", list:["FDM 3D printer","Diod lazer (20W)","CO2 lazer (60-100W)","CNC router","Lehim stansiyasi","Multimetr","Parma stanogi (drill press)","Aerograf","PCB ishlab chiqarish (printer yoki servis)","Charxlash mashinasi"], note:"3D printer, 20W diod lazer, CO2 lazer, CNC 3018 sinfidagi stanok, lehim stansiyasi, parma, aerograf."},
  pro:   {n:"Professional ustaxona", list:["CO2 lazer (60-100W)","Diod lazer (20W)","Fiber lazer","CNC frezer (mill)","CNC tokarlik (lathe)","CNC router","FDM 3D printer","Resin (MSLA) 3D printer","Sanoat 3D printeri (SLS/MJF/metall)","UV printer","Payvandlash apparati","Lehim stansiyasi","Osilloskop","Multimetr","Parma stanogi (drill press)","Bukish mashinasi (press brake)","Charxlash mashinasi","Silliqlash/jilolash mashinasi","Aerograf","Purkash kabinasi (spray booth)","Gravyura mashinasi","Termoformovka stansiyasi","PCB ishlab chiqarish (printer yoki servis)"], note:"CO2 va fiber lazer, CNC frezer/tokarlik, sanoat 3D printer, UV printer, payvandlash, o'lchov asboblari."},
  industrial:{n:"Sanoat ishlab chiqarish", list:Object.keys(MACH), note:"5 o'qli CNC, fiber lazer, list metall liniyasi, quyma qoliplash, robotlar, PCB montaj va sirt ishlovi liniyalari."}
};

/* Materiallar bazasi */
const MATS = {
 al6061:{n:"Alyuminiy 6061", props:"Zichlik 2.7 g/sm3; yengil, mustahkam; yaxshi ishlanadi; anodlanadi", use:"Korpus, ramka, bo'g'in, radiator", how:"CNC frezer, lazer (fiber), bukish", alt:"Alyuminiy 5052 (list), PETG/ASA (3D bosma)"},
 ss304:{n:"Zanglamas po'lat 304", props:"Zichlik 8.0 g/sm3; zanglamaydi; og'ir; ishlash qiyinroq", use:"O'qlar, mahkamlagichlar, nam muhit detallari", how:"CNC, fiber lazer, payvand", alt:"Alyuminiy, uglerodli po'lat + qoplama"},
 steel:{n:"Po'lat (uglerodli)", props:"Yuqori mustahkamlik; zanglaydi, qoplama kerak", use:"Tishli g'ildirak, o'q, podshipnik, mahkamlagich", how:"CNC, termik ishlov", alt:"Zanglamas po'lat, POM (past yuk uchun)"},
 abs:{n:"ABS", props:"Zarbaga chidamli; 90-100C gacha; yopishtirish/silliqlash oson", use:"Korpus, qopqoq", how:"FDM 3D bosma, qoliplash", alt:"PETG, ASA"},
 pla:{n:"PLA", props:"Oson bosiladi; mo'rt; ~55C da yumshaydi", use:"Maket va ko'rgazmali detallar", how:"FDM 3D bosma", alt:"PETG"},
 petg:{n:"PETG", props:"Mustahkam, yengil egiluvchan; ~75C; namga chidamli", use:"Korpus, funksional prototip", how:"FDM 3D bosma, lazer kesish emas", alt:"ABS/ASA, polikarbonat"},
 pc:{n:"Polikarbonat", props:"Juda zarbaga chidamli; shaffof; ~120C", use:"Visor, himoya qopqog'i, shaffof korpus", how:"CNC, termoformovka, lazer bilan sifatli kesilmaydi", alt:"Akril (kamroq mustahkam), PETG"},
 acrylic:{n:"Akril (PMMA)", props:"Shaffof/rangli; mo'rt; lazerda yaxshi kesiladi, qirrasi yaltiraydi", use:"Yorug' korpus, diffuzor, panel", how:"CO2 lazer, CNC router", alt:"Polikarbonat, PETG"},
 mdf:{n:"MDF", props:"Arzon, bir xil; namdan bo'kadi", use:"Maket, ichki karkas", how:"CO2 lazer, CNC router", alt:"Fanera, karton"},
 plywood:{n:"Fanera", props:"Yengil, yetarlicha mustahkam; lazerda kesiladi", use:"Karkas, maket, kronshteyn", how:"Lazer (CO2/diod), CNC router", alt:"MDF, akril"},
 cf:{n:"Uglerod tola (karbon)", props:"Juda yengil va qattiq; qimmat; kesishda chang zararli", use:"Yengil ramka, qalqon panel", how:"CNC (maxsus asbob), qo'lda qatlamlash", alt:"Stekloplastik, alyuminiy"},
 silicone:{n:"Silikon", props:"Egiluvchan, issiqqa chidamli; yopishqoq", use:"Zichlagich, tutqich qoplama, qolip", how:"Quyma (3D bosma qolipda)", alt:"TPU (3D bosma)"},
 pom:{n:"Muhandislik plastigi (POM/Nylon)", props:"Kam ishqalanish; mustahkam; tishli g'ildirak uchun yaxshi", use:"Tishli g'ildirak, vtulka, sirpanuvchi detal", how:"CNC, SLS/MJF (nylon)", alt:"PETG (kamroq chidamli), po'lat"},
 copper:{n:"Mis", props:"Yuqori issiqlik/elektr o'tkazuvchanlik", use:"Radiator, shina, sovutish plastinasi", how:"CNC, kesish", alt:"Alyuminiy"},
 brass:{n:"Latun", props:"Ishlanishi oson, chiroyli ko'rinish, korroziyaga chidamli", use:"Vtulka, dekorativ elementlar", how:"CNC tokarlik", alt:"Alyuminiy, bronza"},
 fr4:{n:"FR4 (PCB)", props:"Shisha-epoksid; elektr izolyatsiya", use:"Bosma plata", how:"PCB ishlab chiqarish servisi", alt:"Alyuminiy asosli PCB (LED uchun)"},
 elec:{n:"Elektron komponentlar", props:"Kremniy, kondensator, rezistor va h.k.", use:"Kontroller, sensor, quvvat", how:"Sotib olinadi", alt:"-"},
 li:{n:"Li-ion elementlar", props:"3.7V/element; yong'in xavfi: BMS shart", use:"Batareya", how:"Sotib olinadi (18650/21700 yoki LiPo)", alt:"LiFePO4 (xavfsizroq, og'irroq)"}
};

/* Komponent kutubxonasi */
const LIB = {
 housing_led:{n:"Yorug' korpus (akril + LED)", grp:"struct", mfg:"Ishlab chiqariladi", method:"CO2 lazer bilan kesish + yig'ish + LED tizimi", mach:["CO2 lazer (60-100W)","CNC router"], mk:"acrylic", alt:"Polikarbonat yoki PETG (3D bosma)", why:"Yorug'lik tarqatish va tez prototiplash uchun akril eng qulay.", cx:1, st:"current", cost:45, cat:"laser", hrs:3, color:"#4cc9f0", fic:"Yorqin, porlayotgan korpus", laser:true},
 housing_alu:{n:"Alyuminiy korpus (CNC)", grp:"struct", mfg:"Ishlab chiqariladi", method:"CNC frezerlash + anodlash", mach:["CNC frezer (mill)","Silliqlash/jilolash mashinasi"], mk:"al6061", alt:"3D bosma PETG/ASA yoki list metall", why:"Mustahkamlik va issiqlik tarqatish; sanoat ko'rinishi.", cx:2, st:"current", cost:180, cat:"machining", hrs:6, color:"#9aa7b8", fic:"Yaxlit metall qobiq"},
 housing_print:{n:"3D bosma korpus", grp:"struct", mfg:"Ishlab chiqariladi", method:"FDM 3D bosma + silliqlash + bo'yash", mach:["FDM 3D printer","Aerograf"], mk:"petg", alt:"ASA, polikarbonat (SLS nylon)", why:"Murakkab shakllarni arzon va tez olish.", cx:0, st:"current", cost:28, cat:"print", hrs:2, color:"#7c8aa0", fic:"Silliq, uzluksiz qobiq", print:{nozzle:0.4, layer:0.2, infill:15, walls:3, support:"Kerak (osilgan qismlar uchun)", orient:"Eng katta tekis tomoni pastga"}},
 frame_sheet:{n:"Metall ramka (list metall)", grp:"struct", mfg:"Ishlab chiqariladi", method:"Lazer/CNC kesish + bukish", mach:["Fiber lazer","Bukish mashinasi (press brake)","CNC frezer (mill)"], mk:"al6061", alt:"Po'lat list + payvand yoki 2020 profil", why:"Yengil va qattiq tayanch ramka.", cx:2, st:"current", cost:140, cat:"machining", hrs:5, color:"#8892a6", fic:"Futuristik metall karkas", laser:true},
 frame_profile:{n:"Alyuminiy profil ramka (2020)", grp:"struct", mfg:"Sotib olinadi + kesiladi", method:"Tayyor profilni kesish va burchak bilan yig'ish", mach:["Charxlash mashinasi","Parma stanogi (drill press)"], mk:"al6061", alt:"Po'lat quvur + payvand", why:"Moduli, arzon va qayta sozlanadi.", cx:0, st:"current", cost:35, cat:"mechanical", hrs:1, color:"#8892a6", fic:"Ochiq karkas"},
 motor_servo:{n:"Servo / BLDC motor", grp:"mech", mfg:"Sotib olinadi", method:"Tayyor motorni o'rnatish", mach:[], mk:"elec", alt:"Qadamli motor + reduktor", why:"Aniq burchak va moment tayyor modul sifatida mavjud.", cx:0, st:"current", cost:32, cat:"mechanical", hrs:0, color:"#ff8a3d", fic:"Quvvatli aktuator"},
 motor_stepper:{n:"Qadamli motor (NEMA17)", grp:"mech", mfg:"Sotib olinadi", method:"Tayyor motor + drayver (TMC2209)", mach:[], mk:"elec", alt:"Servo motor", why:"Past tezlikda aniq aylantirish.", cx:0, st:"current", cost:16, cat:"mechanical", hrs:0, color:"#ff8a3d", fic:"Aylantiruvchi mexanizm yuragi"},
 gearbox:{n:"Planetar reduktor", grp:"mech", mfg:"Sotib olinadi / maxsus", method:"Tayyor planetar reduktor yoki 3D bosma + CNC o'qlar", mach:["FDM 3D printer","CNC frezer (mill)"], mk:"pom", alt:"Zanjir/tasma uzatma", why:"Momentni oshirish va tezlikni kamaytirish.", cx:1, st:"current", cost:42, cat:"mechanical", hrs:2, color:"#c9a227", fic:"Yashirin kuchaytirgich mexanizm"},
 gear:{n:"Tishli g'ildirak", grp:"mech", mfg:"Ishlab chiqariladi", method:"3D bosma (prototip) yoki CNC (POM/po'lat)", mach:["FDM 3D printer","CNC frezer (mill)"], mk:"pom", alt:"PETG (prototip), po'lat (yuqori yuk)", why:"Kuch uzatish; modul va tishlar soni hisoblanadi.", cx:1, st:"current", cost:9, cat:"print", hrs:1, color:"#c9a227", fic:"Murakkab tishli uzatma", print:{nozzle:0.4, layer:0.12, infill:60, walls:4, support:"Kerak emas", orient:"Tish yuzasi yuqoriga (tekis yotqizing)"}},
 bearing:{n:"Podshipnik", grp:"mech", mfg:"Sotib olinadi", method:"Standart podshipnik (608/6001)", mach:[], mk:"steel", alt:"Bronza vtulka (past tezlik)", why:"Aylanishni silliq va aniq qiladi.", cx:0, st:"current", cost:3, cat:"mechanical", hrs:0, color:"#b8c0cc", fic:"Silliq aylanuvchi halqa"},
 joint:{n:"Bo'g'in (sharnir)", grp:"mech", mfg:"Ishlab chiqariladi", method:"CNC + podshipnik + o'q", mach:["CNC frezer (mill)","CNC tokarlik (lathe)"], mk:"al6061", alt:"3D bosma bo'g'in + podshipnik", why:"Harakatlanuvchi qismlarni biriktiradi.", cx:1, st:"current", cost:30, cat:"machining", hrs:2, color:"#9aa7b8", fic:"Egiluvchan bo'g'in"},
 arm_link:{n:"Qo'l bo'g'ini (zveno)", grp:"mech", mfg:"Ishlab chiqariladi", method:"CNC frezerlash yoki 3D bosma + uglerod quvur", mach:["CNC frezer (mill)","FDM 3D printer"], mk:"al6061", alt:"Uglerod quvur + 3D bosma ulagich", why:"Yengil va qattiq zveno kerak.", cx:2, st:"current", cost:70, cat:"machining", hrs:3, color:"#9aa7b8", fic:"Ingichka kuchli qo'l"},
 gripper:{n:"Tutgich (gripper)", grp:"mech", mfg:"Ishlab chiqariladi", method:"3D bosma barmoqlar + servo + silikon qoplama", mach:["FDM 3D printer"], mk:"petg", alt:"Alyuminiy barmoqlar", why:"Narsani ushlash uchun oddiy parallel tutgich.", cx:1, st:"modified", cost:40, cat:"print", hrs:2, color:"#7c8aa0", fic:"Aqlli barmoqlar", print:{nozzle:0.4, layer:0.16, infill:40, walls:4, support:"Qisman", orient:"Barmoq yassi tomoni pastga"}},
 pcb:{n:"Maxsus bosma plata (PCB)", grp:"elec", mfg:"Maxsus buyurtma", method:"Sxema/layout -> servisda ishlab chiqarish -> lehimlash", mach:["PCB ishlab chiqarish (printer yoki servis)","Lehim stansiyasi","Osilloskop"], mk:"fr4", alt:"Perfboard / modul yig'ma (prototip)", why:"Elektronikani ixcham va ishonchli qiladi.", cx:1, st:"current", cost:28, cat:"electronics", hrs:3, color:"#1f9d55", fic:"Yashirin 'miya'"},
 mcu:{n:"Kontroller (ESP32 / STM32)", grp:"elec", mfg:"Sotib olinadi", method:"Tayyor modul (ESP32-S3, STM32, Raspberry Pi Zero 2 W)", mach:["Lehim stansiyasi"], mk:"elec", alt:"Arduino / RP2040", why:"Sensorlar, motorlar va aloqani boshqaradi.", cx:0, st:"current", cost:9, cat:"electronics", hrs:0, color:"#2dd4bf", fic:"Aqlli boshqaruv yadrosi"},
 sensor:{n:"Sensorlar (IMU, masofa, harorat)", grp:"elec", mfg:"Sotib olinadi", method:"Tayyor modullar (MPU6050/BNO055, VL53L0X, BME280)", mach:["Lehim stansiyasi","Multimetr"], mk:"elec", alt:"Kamera + kompyuter ko'rish", why:"Qurilma atrofni va holatini sezishi uchun.", cx:0, st:"current", cost:14, cat:"electronics", hrs:0, color:"#2dd4bf", fic:"Atrofni sezuvchi 'ko'zlar'"},
 battery:{n:"Li-ion batareya bloki", grp:"elec", mfg:"Sotib olinadi", method:"18650/21700 elementlar + BMS yoki tayyor LiPo", mach:["Lehim stansiyasi","Multimetr"], mk:"li", alt:"LiFePO4, tashqi quvvat bloki", why:"Avtonom ishlash uchun energiya manbai.", cx:1, st:"current", cost:32, cat:"electronics", hrs:0, color:"#f59e0b", fic:"Cheksiz energiya manbai"},
 power:{n:"BMS + DC-DC konverter", grp:"elec", mfg:"Sotib olinadi", method:"Tayyor BMS va buck/boost modul", mach:["Multimetr"], mk:"elec", alt:"Tayyor power bank moduli", why:"Batareyani himoyalaydi, kuchlanishni moslaydi.", cx:0, st:"current", cost:14, cat:"electronics", hrs:0, color:"#f59e0b", fic:"Energiya taqsimlovchi"},
 display_oled:{n:"OLED / TFT ekran", grp:"ui", mfg:"Sotib olinadi", method:"Tayyor modul (SSD1306, ST7789)", mach:[], mk:"elec", alt:"E-ink ekran", why:"Axborotni ko'rsatish.", cx:0, st:"current", cost:18, cat:"electronics", hrs:0, color:"#38bdf8", fic:"Yorqin interfeys ekrani"},
 holo_screen:{n:"'Gologramma' ekran (shaffof ekran / proyeksiya)", grp:"ui", mfg:"Sotib olinadi / yig'iladi", method:"Pepper's ghost (shaffof akril + proyektor) yoki shaffof OLED/LCD", mach:["CO2 lazer (60-100W)"], mk:"acrylic", alt:"AR ko'zoynak; volumetrik (aylanuvchi LED) displey", why:"Havoda erkin gologramma hozircha yo'q; Pepper's ghost va volumetrik displey yaqin texnologiyalar.", cx:2, st:"experimental", cost:95, cat:"mechanical", hrs:3, color:"#22d3ee", fic:"Havoda suzuvchi gologramma", emis:true, laser:true},
 led_ring:{n:"LED halqa/lenta (WS2812)", grp:"ui", mfg:"Sotib olinadi", method:"Adreslanuvchi LED lentani halqaga o'rnatish", mach:["Lehim stansiyasi"], mk:"elec", alt:"Elektrolyuminessent lenta", why:"Dinamik rangli yoritish.", cx:0, st:"current", cost:11, cat:"electronics", hrs:0, color:"#39ff88", fic:"Porlayotgan energiya chizig'i", emis:true},
 cooling:{n:"Sovutish (fan + radiator)", grp:"mech", mfg:"Sotib olinadi", method:"5V/12V fan + alyuminiy radiator", mach:[], mk:"al6061", alt:"Passiv radiator", why:"Quvvat elektronikasi va LED uchun issiqlik chiqarish.", cx:0, st:"current", cost:10, cat:"mechanical", hrs:0, color:"#64748b", fic:"Sovutish tizimi"},
 fasteners:{n:"Mahkamlagichlar (M2-M5 vint, gayka)", grp:"mech", mfg:"Sotib olinadi", method:"Standart vint, gayka, shayba, rezba kiritmalari", mach:["Parma stanogi (drill press)"], mk:"ss304", alt:"Yelimlash, snap-fit (3D bosma)", why:"Qismlarni ajratib bo'ladigan qilib biriktiradi.", cx:0, st:"current", cost:7, cat:"mechanical", hrs:0.5, color:"#cbd5e1", fic:"Ko'rinmas biriktirish"},
 optics:{n:"Optika (linza, oyna, ko'zgu)", grp:"opt", mfg:"Sotib olinadi / kesiladi", method:"Tayyor linza/ko'zgu; akril ko'zguni lazerda kesish", mach:["CO2 lazer (60-100W)"], mk:"acrylic", alt:"Fresnel linza", why:"Yorug'likni yo'naltirish va fokuslash.", cx:1, st:"current", cost:36, cat:"mechanical", hrs:1, color:"#a5f3fc", fic:"Maxsus optik tizim", laser:true},
 lens_visor:{n:"Visor (shaffof qobiq)", grp:"opt", mfg:"Ishlab chiqariladi", method:"Polikarbonat listni termoformovka + CO2/CNC kesish", mach:["Termoformovka stansiyasi","CNC router"], mk:"pc", alt:"PETG listi", why:"Zarbaga chidamli, shaffof, shakllanuvchan material.", cx:1, st:"current", cost:30, cat:"machining", hrs:2, color:"#bae6fd", fic:"Egilgan shaffof ekran"},
 ui_panel:{n:"Boshqaruv paneli (tugma, enkoder)", grp:"ui", mfg:"Ishlab chiqariladi", method:"Lazer kesilgan panel + tugmalar + gravyura", mach:["CO2 lazer (60-100W)","Gravyura mashinasi"], mk:"acrylic", alt:"Alyuminiy panel (fiber lazer gravyura)", why:"Foydalanuvchi bilan aloqa.", cx:0, st:"current", cost:15, cat:"laser", hrs:1, color:"#fb923c", fic:"Sensorli boshqaruv paneli", laser:true},
 speaker:{n:"Dinamik / karnay", grp:"ui", mfg:"Sotib olinadi", method:"Mini dinamik + I2S/PAM8403 kuchaytirgich", mach:[], mk:"elec", alt:"Bluetooth karnay moduli", why:"Ovozli aloqa va signal.", cx:0, st:"current", cost:8, cat:"electronics", hrs:0, color:"#94a3b8", fic:"Ovozli interfeys"},
 cable:{n:"Kabel to'plami", grp:"elec", mfg:"Ishlab chiqariladi", method:"Simlarni kesish, konnektor qisish, to'plam", mach:["Lehim stansiyasi"], mk:"copper", alt:"FFC/FPC kabel", why:"Quvvat va signal uzatish.", cx:0, st:"current", cost:12, cat:"assembly", hrs:1.5, color:"#d97706", fic:"Yashirin simlar"},
 core_light:{n:"Energiya yadrosi (LED + diffuzor)", grp:"ui", mfg:"Ishlab chiqariladi", method:"Akril quvur/diffuzor + LED + lazer gravyura; real energiya - batareya", mach:["CO2 lazer (60-100W)","Gravyura mashinasi"], mk:"acrylic", alt:"Shisha trubka + LED lenta", why:"Haqiqiy 'reaktor' emas: yorug'lik effekti, energiya batareyadan.", cx:1, st:"modified", cost:40, cat:"laser", hrs:2, color:"#39ff88", fic:"Cheksiz energiya yadrosi", emis:true, laser:true},
 shield_panel:{n:"Himoya paneli (qalqon)", grp:"struct", mfg:"Ishlab chiqariladi", method:"Karbon/polikarbonat panel + CNC kesish", mach:["CNC router","Silliqlash/jilolash mashinasi"], mk:"cf", alt:"Alyuminiy list, polikarbonat", why:"Yengil himoya qatlami.", cx:2, st:"modified", cost:85, cat:"machining", hrs:3, color:"#475569", fic:"Energiya qalqoni (real qalqon: mexanik panel)"},
 finish:{n:"Sirt ishlovi (bo'yoq/anodlash/lak)", grp:"proc", mfg:"Ishlab chiqariladi", method:"Gruntovka, bo'yash, lak; metall uchun anodlash", mach:["Aerograf","Purkash kabinasi (spray booth)","UV printer"], mk:"abs", alt:"Plyonka (vinil) yopishtirish", why:"Ko'rinish, himoya va 'futuristik' effekt.", cx:1, st:"current", cost:25, cat:"finishing", hrs:3, color:"#e879f9", fic:"Metall-yorqin sirt", nogeo:true}
};

/* 3D joylashuv: kind -> [shape, sx, sy, sz, px, py, pz, rep] ; shape b=box (sx,sy,sz), c=silindr (r,h) */
const LAYOUT = {
 holo:{ housing_led:["c",85,46,0,0,23,0], frame_sheet:["b",140,3,140,0,8,0], motor_stepper:["c",21,38,0,0,30,0], gearbox:["c",17,20,0,0,58,0], bearing:["c",14,6,0,0,50,0],
        pcb:["b",90,2,60,0,12,34], mcu:["b",26,3,18,-20,15,34], sensor:["b",12,3,12,25,15,34], battery:["b",64,18,22,-8,21,-38], power:["b",32,6,22,40,15,-38],
        holo_screen:["b",90,110,2,0,112,-8], led_ring:["r",80,3,72,0,47,0], gear:["c",16,6,0,0,43,0,[[0,0,0],[0,9,0]]], cooling:["c",20,8,0,60,10,0], fasteners:["c",1.6,8,0,0,5,0,[[-60,0,-60],[60,0,-60],[-60,0,60],[60,0,60]]],
        ui_panel:["b",44,3,16,0,32,82], optics:["c",25,3,0,0,100,0], display_oled:["b",30,2,18,0,36,86], cable:["b",60,2,2,-5,22,5], speaker:["c",14,10,0,-55,18,10] },
 arm:{  frame_alu:null, housing_print:["b",70,50,70,0,25,0], motor_servo:["b",40,20,40,0,60,0,[[0,0,0],[0,115,0],[0,205,0],[0,265,0]]], gearbox:["c",20,22,0,0,52,30,[[0,0,0],[0,115,0]]], arm_link:["b",24,100,24,0,115,0,[[0,0,0],[0,90,10]]],
        joint:["c",20,30,0,0,168,0,[[0,0,0],[0,92,0],[0,152,0]]], bearing:["c",14,6,0,0,60,26,[[0,0,0],[0,115,0],[0,205,0]]], gripper:["b",50,40,12,0,300,0], pcb:["b",60,2,45,0,12,0], mcu:["b",26,3,18,0,15,0], sensor:["b",12,3,12,24,15,12],
        battery:["b",60,20,24,0,26,-30], power:["b",32,6,22,0,15,-30], cooling:["c",18,8,0,36,40,0], cable:["b",3,200,3,18,150,12], fasteners:["c",1.6,8,0,0,2,0,[[-30,0,-30],[30,0,-30],[-30,0,30],[30,0,30]]], frame_sheet:["b",90,3,90,0,0,0], joint2:null },
 visor:{ lens_visor:["b",150,60,4,0,60,48], housing_print:["b",150,28,70,0,95,10], display_oled:["b",30,2,18,0,70,30], optics:["c",14,6,0,0,60,26], pcb:["b",50,2,24,0,98,10], mcu:["b",22,3,16,0,101,10], sensor:["b",10,3,10,40,101,10],
        battery:["b",50,12,18,0,98,-12], power:["b",24,5,16,-40,98,-12], led_ring:["c",8,2,0,50,60,50], speaker:["c",8,5,0,-70,70,0], fasteners:["c",1.6,8,0,0,90,10,[[-60,0,0],[60,0,0]]], cable:["b",120,2,2,0,90,20] },
 core:{ core_light:["c",30,150,0,0,95,0], housing_alu:["c",50,26,0,0,13,0], housing_led:["c",45,12,0,0,164,0], frame_profile:["b",4,150,4,0,95,0,[[-34,0,-34],[34,0,-34],[-34,0,34],[34,0,34]]], led_ring:["r",34,3,26,0,60,0], pcb:["b",60,2,60,0,28,0],
        mcu:["b",26,3,18,0,31,0], battery:["b",50,16,22,0,18,-12], power:["b",30,6,20,0,12,18], cooling:["c",20,6,0,0,3,0], fasteners:["c",1.6,8,0,0,2,0,[[-20,0,-20],[20,0,-20],[-20,0,20],[20,0,20]]], ui_panel:["b",30,3,12,0,16,48] }
};

/* Arxetiplar (DEMO rejimi uchun tayyor tahlil shablonlari) */
const ARCH = {
 holo:{n:"Gologramma proyektor-baza", dims:[170,190,170], desc:"Aylanuvchi baza ustida suzuvchi gologramma ekran, yorug' halqa va sensorli boshqaruv.",
   kinds:[["housing_led",1],["frame_sheet",1],["motor_stepper",1],["gearbox",1],["gear",2],["bearing",2],["pcb",1],["mcu",1],["sensor",1],["battery",1],["power",1],["holo_screen",1],["led_ring",1],["cooling",1],["ui_panel",1],["fasteners",24],["finish",1]],
   alts:[
    {fic:"Havoda erkin suzuvchi gologramma", real:"Shaffof OLED / Pepper's ghost / aylanuvchi LED (volumetrik) displey", lim:"Haqiqiy bo'sh havoda 3D tasvir hali yo'q; ko'rish burchagi va yorqinlik cheklangan", fut:"Volumetrik va lazer-plazma displeylar, yorug'lik maydoni (light-field) ekranlari", st:"experimental"},
    {fic:"O'z-o'zidan aylanuvchi yorug' halqa", real:"Qadamli motor + podshipnik + adreslanuvchi LED", lim:"Yo'q - hozir to'liq mumkin", fut:"Yengilroq, sensorsiz BLDC drayvlar", st:"current"},
    {fic:"Qo'l ishorasi bilan boshqarish", real:"Leap Motion / ToF sensor + kompyuter ko'rish", lim:"Aniqlik yorug'likka bog'liq", fut:"Radar (mmWave) asosidagi ishora sezgilari", st:"modified"},
    {fic:"Cheksiz batareya", real:"Li-ion batareya + simsiz zaryad", lim:"Energiya zichligi cheklangan: soatlar, kunlar emas", fut:"Qattiq holatli batareyalar", st:"current"}]},
 arm:{n:"Robot qo'l / manipulator", dims:[120,330,120], desc:"Ko'p bo'g'inli qo'l, servo/BLDC yuritmalar, tutgich va boshqaruv elektronikasi.",
   kinds:[["housing_print",1],["frame_sheet",1],["motor_servo",4],["gearbox",2],["arm_link",2],["joint",3],["bearing",6],["gripper",1],["pcb",1],["mcu",1],["sensor",2],["battery",1],["power",1],["cooling",1],["cable",1],["fasteners",32],["finish",1]],
   alts:[
    {fic:"Inson kabi egiluvchan, kuchli qo'l", real:"Servo/BLDC + planetar reduktor + zveno konstruktsiyasi", lim:"Kuch/og'irlik nisbati va nozik sezgi hali inson darajasida emas", fut:"Sun'iy mushaklar, yumshoq robototexnika", st:"modified"},
    {fic:"Ongli, o'zi qaror qiluvchi robot", real:"Kamera + AI model (kompyuter ko'rish, LLM) + inson nazorati", lim:"Ishonchlilik va xavfsizlik; tartibga solinmagan muhitda xatolar", fut:"Ishonchli umumiy maqsadli robot modellari", st:"experimental"},
    {fic:"Sezuvchi teri", real:"Bosim sensor massivlari / tutgichdagi kuch sensori", lim:"Qoplama va yuqori zichlikdagi sezgi hali qimmat", fut:"Elektron teri (e-skin)", st:"experimental"}]},
 visor:{n:"Kiyiladigan HUD visor / ko'zoynak", dims:[160,70,120], desc:"Shaffof visor, kichik displey va optika, sensorlar va yengil korpus.",
   kinds:[["lens_visor",1],["housing_print",1],["display_oled",1],["optics",2],["pcb",1],["mcu",1],["sensor",2],["battery",1],["power",1],["led_ring",1],["speaker",2],["cable",1],["fasteners",8],["finish",1]],
   alts:[
    {fic:"Butun ko'rish maydonini qoplaydigan shaffof HUD", real:"Mikro-displey + waveguide/birdbath optikasi (AR ko'zoynak)", lim:"Ko'rish maydoni tor, yorqinlik va og'irlik muammolari", fut:"Keng FOV waveguide, mikro-LED", st:"modified"},
    {fic:"Ko'z ostida cheksiz ma'lumot", real:"Telefon/bulutdan oqim + yengil tahrirlangan interfeys", lim:"Batareya va issiqlik; tashqi yorug'likda ko'rinish", fut:"Samaraliroq displeylar va chiplar", st:"current"},
    {fic:"Fikr bilan boshqarish", real:"Ovoz, ko'z kuzatuvi, EMG tasmasi", lim:"Neyrointerfeys aniq va qulay emas", fut:"Noinvaziv BCI tadqiqotlari", st:"speculative"}]},
 core:{n:"Energiya yadrosi / reaktor chirog'i", dims:[110,190,110], desc:"Vertikal yorug' silindr, metall asos, tepa qopqoq va batareya bilan ishlovchi LED effekti.",
   kinds:[["core_light",1],["housing_alu",1],["housing_led",1],["frame_profile",4],["led_ring",1],["pcb",1],["mcu",1],["battery",1],["power",1],["cooling",1],["ui_panel",1],["fasteners",16],["finish",1]],
   alts:[
    {fic:"Cheksiz energiya beruvchi yadro", real:"Li-ion batareya + LED effektlari (haqiqiy energiya manbai emas)", lim:"Termodinamika qonunlari: cheksiz energiya bo'lmaydi", fut:"Yuqori zichlikli batareyalar, yarim vodorod/yonilg'i elementlari", st:"speculative"},
    {fic:"Plazma/energiya oqimi ko'rinishi", real:"Adreslanuvchi LED + diffuzor + yorug'lik quvuri", lim:"Faqat vizual effekt", fut:"Mikro-LED volumetrik elementlar", st:"current"},
    {fic:"Simsiz quvvat uzatish", real:"Qi/rezonansli induktiv zaryad (bir necha sm)", lim:"Masofa qisqa, FOYDALI quvvat kichik", fut:"Uzoq masofali ixcham simsiz energiya (tadqiqot)", st:"experimental"}]}
};

/* Ish jarayoni (pipeline) */
const PIPE = [
 {k:"concept", n:"Kontseptni ishlab chiqish", d:"Rasm tahlili, talablar va cheklovlar", need:()=>true, days:2},
 {k:"cad", n:"CAD modellash", d:"Parametrik 3D model va chizmalar", need:()=>true, days:5},
 {k:"calc", n:"Muhandislik hisoblari", d:"Moment, issiqlik, quvvat, mustahkamlik", need:()=>true, days:3},
 {k:"mat", n:"Material tanlash", d:"Xossa, narx va ishlab chiqarish usuliga ko'ra", need:()=>true, days:1},
 {k:"proto", n:"Prototip (maket)", d:"Tezkor 3D bosma/karton maket bilan tekshirish", need:()=>true, days:3},
 {k:"cnc", n:"CNC ishlov", d:"Frezer/tokarlik detallar", need:s=>s.mach.some(m=>MACH[m]==="CNC"), days:5},
 {k:"laser", n:"Lazer kesish", d:"Akril, fanera, list metall", need:s=>s.mach.some(m=>MACH[m]==="LASER"), days:2},
 {k:"print", n:"3D bosma", d:"Korpus, tishli g'ildirak, qismlar", need:s=>s.mach.some(m=>MACH[m]==="3D"), days:3},
 {k:"elec", n:"Elektronika yig'ish", d:"PCB, lehim, sinov", need:s=>s.hasElec, days:4},
 {k:"finish", n:"Sirt ishlovi", d:"Silliqlash, bo'yash, anodlash", need:s=>s.mach.some(m=>MACH[m]==="SIRT ISHLOVI"||m==="Silliqlash/jilolash mashinasi"), days:3},
 {k:"asm", n:"Mexanik yig'ish", d:"Mahkamlash, kabel, sozlash", need:()=>true, days:2},
 {k:"test", n:"Sinov", d:"Funksional, yuklama, xavfsizlik", need:()=>true, days:4},
 {k:"final", n:"Tayyor mahsulot", d:"Hujjat, qadoq, namoyish", need:()=>true, days:1}
];
const ROAD = ["G'oya","Kontsept","CAD","Simulyatsiya","Prototip","Funksional prototip","Sinov","Sertifikatsiya","Kichik seriya","Ommaviy ishlab chiqarish"];
const ROAD_D = ["Rasm va muammo aniqlanadi","Talablar, variantlar, arxitektura","Parametrik model va chizmalar","Mustahkamlik, issiqlik, kinematika hisoblari","Tez maket (3D bosma/lazer)","Elektronika va dastur bilan ishlaydigan nusxa","Muhit, yuklama, foydalanuvchi sinovlari","Xavfsizlik va me'yoriy talablar (CE/FCC va h.k.)","10-100 dona, jarayonni barqarorlash","Qolip, avtomatlashtirish, sifat nazorati"];

/* Lazer qiymatlari (boshlang'ich; har doim chiqindi material bilan sinang) */
const LASER_TBL = {
 acrylic:{3:{co2:["65-75%","12-18","1"],diode:["Faqat gravyura (qora/rangli); shaffofni kesmaydi","-","-"]},5:{co2:["85-95%","6-10","1-2"],diode:["Faqat gravyura","-","-"]},engrave:{co2:["15-25%","200-300","1"],diode:["60-80%","1500-2500 mm/min","1"]}},
 plywood:{3:{co2:["55-70%","14-20","1"],diode:["100%","150-250 mm/min","2-4"]},engrave:{co2:["15-30%","250-350","1"],diode:["50-70%","2000-3000 mm/min","1"]}},
 mdf:{3:{co2:["55-65%","12-18","1"],diode:["100%","120-200 mm/min","3-5"]},engrave:{co2:["15-25%","250-350","1"],diode:["50-65%","2000-3000 mm/min","1"]}},
 al6061:{1:{fiber:["Yupqa list (<=1 mm): 100-300W fiber lazer, ko'pincha 1-2 o'tish; ustaxona 20-50W lazer kesmaydi","-","-"]},engrave:{fiber:["60-80% (20-50W)","600-1500 mm/s","1-2"]}}
};

/* ===== Kengaytma: yangi komponentlar, qurilma turlari, kalit so'zlar ===== */
Object.assign(LIB,{
 rotor:{n:"Rotor (BLDC motor + parrak)", grp:"mech", mfg:"Sotib olinadi", method:"BLDC motor (2306) + ESC + 5-6 dyuymli parrak", mach:[], mk:"elec", alt:"Kanalli fan (ducted fan) - shovqin kamroq", why:"Havoda ushlab turish uchun tortish kuchi rotordan keladi (antigravitatsiya emas).", cx:1, st:"modified", cost:38, cat:"mechanical", hrs:0, color:"#ff8a3d", fic:"Havoda suzuvchi antigravitatsiya"},
 camera:{n:"Kamera moduli", grp:"elec", mfg:"Sotib olinadi", method:"Tayyor modul (Raspberry Pi Camera, OV2640, ESP32-CAM)", mach:["Lehim stansiyasi"], mk:"elec", alt:"Telefon kamerasi", why:"Atrofni ko'rish, kompyuter ko'rishi uchun.", cx:0, st:"current", cost:15, cat:"electronics", hrs:0, color:"#2dd4bf", fic:"Sun'iy ko'z"},
 antenna:{n:"Antenna (Wi-Fi / LoRa / GPS)", grp:"elec", mfg:"Sotib olinadi", method:"Tayyor antenna moduli (2.4 GHz, 868/915 MHz LoRa, GNSS)", mach:[], mk:"elec", alt:"PCB antenna (plata ichida)", why:"Simsiz aloqa va joylashuv.", cx:0, st:"current", cost:6, cat:"electronics", hrs:0, color:"#94a3b8", fic:"Uzoq aloqa"},
 grip:{n:"Tutqich (ergonomik dasta)", grp:"struct", mfg:"Ishlab chiqariladi", method:"3D bosma (PETG/TPU) + silikon yoki rezina qoplama", mach:["FDM 3D printer","Aerograf"], mk:"petg", alt:"Alyuminiy dasta + rezina qoplama", why:"Qo'lda ushlash qulayligi va zarbadan himoya.", cx:0, st:"current", cost:14, cat:"print", hrs:1.5, color:"#6b7686", fic:"Qo'lga mos dasta", print:{nozzle:0.4, layer:0.2, infill:20, walls:3, support:"Qisman", orient:"Uzun o'qi bo'ylab yotqizing"}},
 wheel:{n:"G'ildirak + motor-reduktor", grp:"mech", mfg:"Sotib olinadi / yig'iladi", method:"Tayyor g'ildirak + DC reduktorli motor yoki 3D bosma disk + TPU shina", mach:["FDM 3D printer"], mk:"petg", alt:"Zanjirli (gusenitsa) yurish tizimi", why:"Yer ustida yurish uchun eng sodda va ishonchli yechim.", cx:1, st:"current", cost:24, cat:"mechanical", hrs:0.5, color:"#475569", fic:"Yengil yuruvchi tayanch"},
 light_tube:{n:"Yorug' quvur (diffuzor + LED lenta)", grp:"ui", mfg:"Ishlab chiqariladi", method:"Matt akril/polikarbonat quvur + LED lenta + diffuzor + ichki alyuminiy profil", mach:["Silliqlash/jilolash mashinasi"], mk:"acrylic", alt:"Shisha trubka + LED neon lenta", why:"Faqat yorug'lik effekti (rekvizit); real energiya batareyadan olinadi.", cx:1, st:"modified", cost:34, cat:"materials", hrs:1, color:"#39ff88", fic:"Energiya oqimi (yorug' tayoq)", emis:true}
});
Object.assign(LAYOUT,{
 drone:{ housing_print:["b",70,28,70,0,22,0], arm_link:["b",150,6,9,0,24,0,[[0,0,0,45],[0,0,0,135]]], rotor:["c",26,2,0,0,36,0,[[54,0,54],[-54,0,54],[54,0,-54],[-54,0,-54]]],
         pcb:["b",50,2,50,0,14,0], mcu:["b",24,3,16,0,17,6], sensor:["b",12,3,12,18,17,-12], battery:["b",60,18,28,0,30,0], power:["b",30,6,20,0,12,-26], camera:["b",18,16,18,0,18,40], antenna:["c",1.5,40,0,-28,50,-28], led_ring:["r",32,2,26,0,6,0], fasteners:["c",1.6,8,0,0,12,0,[[-25,0,-25],[25,0,-25],[-25,0,25],[25,0,25]]] },
 rover:{ housing_print:["b",110,30,190,0,36,0], frame_sheet:["b",126,3,210,0,16,0], wheel:["x",24,16,0,0,24,0,[[68,0,70],[-68,0,70],[68,0,-70],[-68,0,-70]]], pcb:["b",70,2,60,0,22,10], mcu:["b",26,3,18,0,25,10], sensor:["c",12,10,0,0,58,80], camera:["b",24,18,18,0,60,92],
         battery:["b",60,18,90,0,26,-40], power:["b",30,6,20,0,22,40], led_ring:["r",30,2,22,0,52,-30], cable:["b",3,3,150,30,22,0], fasteners:["c",1.6,8,0,0,18,0,[[-50,0,-90],[50,0,-90],[-50,0,90],[50,0,90]]], antenna:["c",1.5,36,0,40,70,-70] },
 scanner:{ housing_print:["b",72,140,24,0,70,0], display_oled:["b",56,70,2,0,95,13], sensor:["b",14,6,8,0,128,-8], camera:["b",18,18,6,-18,128,-10], pcb:["b",50,2,40,0,60,0], mcu:["b",22,3,16,0,63,0], battery:["b",50,60,10,0,50,-8], power:["b",26,5,18,0,22,0], grip:["c",16,60,0,0,26,0], led_ring:["r",12,2,8,22,120,12], speaker:["c",8,4,0,-22,32,12], ui_panel:["b",30,3,10,0,50,13], antenna:["c",1.5,26,0,28,148,0], fasteners:["c",1.6,8,0,0,70,0,[[-30,0,0],[30,0,0]]] },
 blade:{ grip:["c",16,160,0,0,80,0], light_tube:["c",13,620,0,0,470,0], led_ring:["r",16,3,12,0,162,0], pcb:["b",20,100,8,0,70,0], mcu:["b",14,18,3,0,100,5], battery:["c",9,140,0,0,60,-8], power:["b",14,24,5,0,110,-4], speaker:["c",10,6,0,0,12,0], sensor:["b",8,3,8,0,40,6], ui_panel:["b",12,6,3,0,128,16], fasteners:["c",1.5,8,0,0,150,0,[[-12,0,0],[12,0,0]]] }
});
Object.assign(ARCH,{
 drone:{n:"Uchuvchi dron (multirotor)", dims:[160,60,160], desc:"4 rotorli uchuvchi apparat: ramka, BLDC rotorlar, uchish kontrolleri, kamera va batareya.",
   kinds:[["housing_print",1],["arm_link",2],["rotor",4],["pcb",1],["mcu",1],["sensor",2],["battery",1],["power",1],["camera",1],["antenna",1],["led_ring",1],["cable",1],["fasteners",24],["finish",1]],
   alts:[{fic:"Antigravitatsiya (havoda osilib turish)", real:"Multirotor tortish kuchi (BLDC + parrak)", lim:"Parvoz vaqti ~15-40 daqiqa; shovqin; shamolga sezgir", fut:"Yuqori energiya zichlikli batareyalar, vodorodli yonilg'i elementlari", st:"modified"},
         {fic:"O'zi uchadigan aqlli apparat", real:"Avtopilot (PX4/ArduPilot) + GPS + kamera", lim:"Murakkab muhitda xavfsizlik va qonuniy cheklovlar", fut:"Ishonchli avtonom navigatsiya", st:"modified"},
         {fic:"Jim uchish", real:"Kanalli fan, katta sekin parraklar", lim:"Shovqin to'liq yo'qolmaydi", fut:"Maxsus aerodinamik parraklar", st:"experimental"}]},
 rover:{n:"Yurib boruvchi robot (rover)", dims:[130,90,210], desc:"G'ildirakli mobil platforma: shassi, motorlar, sensorlar, kamera va batareya.",
   kinds:[["housing_print",1],["frame_sheet",1],["wheel",4],["pcb",1],["mcu",1],["sensor",2],["camera",1],["battery",1],["power",1],["led_ring",1],["antenna",1],["cable",1],["fasteners",24],["finish",1]],
   alts:[{fic:"Har qanday yerdan yuradigan mashina", real:"Gusenitsa yoki yo'l-yo'riq g'ildiraklar + yumshoq osma", lim:"Qiya, notekis relyefda cheklangan", fut:"Oyoqli/gibrid yurish tizimlari", st:"modified"},
         {fic:"O'zi yo'l topadi", real:"LiDAR/kamera + SLAM + navigatsiya (ROS 2)", lim:"Murakkab muhitda xato qilishi mumkin", fut:"Ishonchli umumiy navigatsiya", st:"current"}]},
 scanner:{n:"Qo'l skaneri / aqlli gadjet (tricorder)", dims:[72,150,26], desc:"Qo'lda ushlanadigan qurilma: ekran, sensorlar, kamera, tutqich va batareya.",
   kinds:[["housing_print",1],["display_oled",1],["sensor",2],["camera",1],["pcb",1],["mcu",1],["battery",1],["power",1],["grip",1],["led_ring",1],["speaker",1],["ui_panel",1],["antenna",1],["fasteners",8],["finish",1]],
   alts:[{fic:"Hamma narsani bir zumda skanerlaydi", real:"Sensor to'plami (gaz, harorat, namlik, ToF) + kamera", lim:"Har bir o'lchov uchun alohida sensor kerak; materialni to'liq aniqlay olmaydi", fut:"Miniatyur spektrometrlar (NIR)", st:"experimental"},
         {fic:"Tibbiy skanerlash", real:"PPG puls, harorat, ECG elektrodlar (wellness darajasi)", lim:"Tibbiy tashxis uchun sertifikatsiya kerak", fut:"Sertifikatlangan portativ diagnostika", st:"experimental"}]},
 exo:{n:"Kiyiladigan ekzoskelet / zirh", dims:[500,700,300], desc:"Tanaga kiyiladigan ramka: bo'g'inlar, yuritmalar, batareya va boshqaruv elektronikasi.",
   kinds:[["frame_sheet",1],["arm_link",4],["joint",4],["motor_servo",4],["gearbox",4],["bearing",8],["shield_panel",2],["pcb",1],["mcu",1],["sensor",3],["battery",1],["power",1],["cable",1],["fasteners",40],["finish",1]],
   alts:[{fic:"Inson kuchini bir necha baravar oshiradi", real:"Aktiv ekzoskelet (reduktorli motorlar) - yengil yuklarni ko'tarishda yordam", lim:"Batareya, og'irlik, xavfsizlik; to'liq 'super kuch' mumkin emas", fut:"Yengil sun'iy mushaklar", st:"experimental"},
         {fic:"O'tmas zirh", real:"Karbon/polikarbonat/kevlar qatlamli panellar", lim:"Og'irlik va harakatchanlik bilan kelishish kerak", fut:"Yangi kompozitlar", st:"modified"}]},
 prop:{n:"Yorug' tayoq (rekvizit)", dims:[60,800,60], desc:"Kosplay/rekvizit: yorug' quvur, tutqich, LED, batareya va ovoz effektlari. Funksiyasiz (faqat yorug'lik).",
   kinds:[["grip",1],["light_tube",1],["led_ring",1],["pcb",1],["mcu",1],["sensor",1],["battery",1],["power",1],["speaker",1],["ui_panel",1],["fasteners",6],["finish",1]],
   alts:[{fic:"Energiya pichog'i", real:"LED yorug' quvur (faqat yorug'lik effekti, rekvizit)", lim:"Haqiqiy plazma/energiya tig'i yo'q; bu xavfsiz namoyish buyumi", fut:"Yo'q (fantastika)", st:"speculative"},
         {fic:"Zarbadan chiqadigan ovoz va nur", real:"IMU sensor + ovoz effektlari + LED animatsiya", lim:"Yo'q: to'liq mumkin", fut:"Yengilroq batareyalar", st:"current"}]}
});
const KEYWORDS = {
 holo:["gologramma","hologram","holo","proyektor","projector"],
 arm:["robot qo'l","manipulyator","tutgich","gauntlet","claw","bilak","qo'l"],
 visor:["ko'zoynak","kozoynak","visor","hud","shlem","helmet","glasses","goggles","ar "],
 core:["reaktor","yadro","reactor","core","kristal","crystal","chiroq","lamp"],
 drone:["dron","drone","uchuvchi","quadcopter","jetpack","parvoz","propeller","kopter","helicopter"],
 rover:["rover","g'ildirak","gildirak","mashina","avtomobil","vehicle","tank","car","transport","yurib"],
 scanner:["skaner","scanner","tricorder","detektor","gadjet","gadget","planshet","pda","telefon"],
 exo:["ekzoskelet","exo","zirh","armor","suit","kostyum","mech","kiyiladigan zirh"],
 prop:["qilich","saber","lightsaber","yorug' tayoq","tayoq","wand","pichoq"]
};
function guessArch(text){
  const t=String(text||"").toLowerCase().replace(/[‘’ʻ`]/g,"'"); let best=null,bs=0;
  Object.entries(KEYWORDS).forEach(([k,ws])=>{ const s=ws.filter(w=>t.includes(w.replace(/[‘’ʻ`]/g,"'"))).length; if(s>bs){bs=s;best=k;} });
  return best;
}
