# RFID-Karten Zuordnung - Agroforst Game

## ⚠️ WICHTIG: Diese IDs sind bindend und entsprechen den physischen RFID-Karten!

Status: ✅ FINAL - Diese Zuordnung darf NICHT mehr geändert werden

---

## 🌾 ACKERPFLANZEN (A1-A10)

| Karten-ID | RFID-Nummer   | Pflanzen-Name | Code-ID        | Song-IDs       |
|-----------|---------------|---------------|----------------|----------------|
| **A1**    | 0009812671    | Weizen        | P001_WEIZEN    | T001-T010 + P001 |
| **A2**    | 0009811409    | Mais          | P002_MAIS      | T001-T010 + P002 |
| **A3**    | 0009810077    | Kartoffel     | P003_KARTOFFEL | T001-T010 + P003 |
| **A4**    | 0009550205    | Sojabohne     | P004_SOJABOHNE | T001-T010 + P004 |
| **A5**    | 0009487976    | Hafer         | P005_HAFER     | T001-T010 + P005 |
| **A6**    | 0009840392    | Roggen        | P006_ROGGEN    | T001-T010 + P006 |
| **A7**    | 0009835289    | Gerste        | P007_GERSTE    | T001-T010 + P007 |
| **A8**    | 0009806120    | Raps          | P008_RAPS      | T001-T010 + P008 |
| **A9**    | 0009859503    | Sonnenblume   | P009_SONNENBLUME | T001-T010 + P009 |
| **A10**   | 0009819443    | Zuckerrübe    | P010_ZUCKERRUEBE | T001-T010 + P010 |

---

## 🌳 BÄUME (B1-B10)

| Karten-ID | RFID-Nummer   | Baum-Name     | Code-ID           | Song-IDs       |
|-----------|---------------|---------------|-------------------|----------------|
| **B1**    | 0009806867    | Pappel        | T001_PAPPEL       | T001 + P001-P010 |
| **B2**    | 0009812134    | Eiche         | T002_EICHE        | T002 + P001-P010 |
| **B3**    | 0009809472    | Buche         | T003_BUCHE        | T003 + P001-P010 |
| **B4**    | 0009871245    | Kirschbaum    | T004_KIRSCHBAUM   | T004 + P001-P010 |
| **B5**    | 0009790491    | Apfelbaum     | T005_APFELBAUM    | T005 + P001-P010 |
| **B6**    | 0009842592    | Walnussbaum   | T006_WALNUSSBAUM  | T006 + P001-P010 |
| **B7**    | 0009848178    | Birne         | T007_BIRNE        | T007 + P001-P010 |
| **B8**    | 0009845399    | Haselstrauch  | T008_HASELSTRAUCH | T008 + P001-P010 |
| **B9**    | 0009825030    | Kastanie      | T009_KASTANIE     | T009 + P001-P010 |
| **B10**   | 0009860093    | Linde         | T010_LINDE        | T010 + P001-P010 |

---

## 🎵 Song-Matrix (100 Kombinationen)

Jede Kombination aus Baum (B1-B10) und Pflanze (A1-A10) ergibt einen einzigartigen Song:

```
        A1      A2      A3      A4      A5      A6      A7      A8      A9      A10
B1    Song001 Song002 Song003 Song004 Song005 Song006 Song007 Song008 Song009 Song010
B2    Song011 Song012 Song013 Song014 Song015 Song016 Song017 Song018 Song019 Song020
B3    Song021 Song022 Song023 Song024 Song025 Song026 Song027 Song028 Song029 Song030
B4    Song031 Song032 Song033 Song034 Song035 Song036 Song037 Song038 Song039 Song040
B5    Song041 Song042 Song043 Song044 Song045 Song046 Song047 Song048 Song049 Song050
B6    Song051 Song052 Song053 Song054 Song055 Song056 Song057 Song058 Song059 Song060
B7    Song061 Song062 Song063 Song064 Song065 Song066 Song067 Song068 Song069 Song070
B8    Song071 Song072 Song073 Song074 Song075 Song076 Song077 Song078 Song079 Song080
B9    Song081 Song082 Song083 Song084 Song085 Song086 Song087 Song088 Song089 Song090
B10   Song091 Song092 Song093 Song094 Song095 Song096 Song097 Song098 Song099 Song100
```
