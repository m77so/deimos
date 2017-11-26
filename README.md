# これなに
JRの運賃計算をしたい.

# 注意
まだつかいものになりません

# 使い方
1. `data`を見て
2. `deimos`で`(npm|yarn) install`
2. `deimos`で`(npm|yarn) run start`

もしくは https://m77.pw/deimos/ で公開しています
# 旅規実装状況

## 第3章　旅客運賃・料金
### 第1節　通則
| 番号       | 概要                     | 対応状況     |
|------------|--------------------------------|------|
| 65条       | 運賃の種類                     |      |
| 68条       | 営業キロの計算方               | ![実装部分的](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E9%83%A8%E5%88%86-yellowgreen.svg) |
| 69条       | 経路特定区間                   | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 70条       | 都心特定区間                   | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 71条       | 営業キロを定めていない区間     |      |
| 73条       | 旅客の区分                     |      |
| 74条       | 小児運賃                       | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 74条の２   | 割引の旅客運賃                 | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 74条の３   | 臨時割引                       | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 74条の４   | 特急車両の個室を占有する場合   |      |
| 74条の５   | 寝台個室を占有する場合         |      |
| 74条の６   | コンパートメント個室の占有     |      |
| 75条       | 社内での概算収受               |      |
| 76条       | 割引の重複適用の禁止           | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
### 第2節　普通旅客運賃
| 番号       | 概要                     | 対応状況     |
|------------|--------------------------------|------|
| 77条       | 幹線内相互発着                 | ![実装済み](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E5%AE%8C%E4%BA%86-brightgreen.svg) |
| 77条の２   | 北海道内幹線相互発着           | ![実装部分的](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E9%83%A8%E5%88%86-yellowgreen.svg) |
| 77条の３   | 四国内幹線相互発着             | ![実装部分的](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E9%83%A8%E5%88%86-yellowgreen.svg) |
| 77条の４   | 九州内幹線相互発着             | ![実装部分的](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E9%83%A8%E5%88%86-yellowgreen.svg) |
| 77条の５   | 地方交通線内相互発着           | ![実装済み](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E5%AE%8C%E4%BA%86-brightgreen.svg) |
| 77条の６   | 北海道内地方交通線相互発着     | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 77条の７   | 四国内地方交通線相互発着       | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 77条の８   | 九州内地方交通線相互発着       | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 78条       | 電車特定区間内                 | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 79条       | 東京付近等の特定運賃           | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 81条       | 幹線と地方交通線を連続して乗車 | ![実装済み](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E5%AE%8C%E4%BA%86-brightgreen.svg) |
| 81条の２   | 北海道内の幹線と地方交通線     | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 81条の３   | 四国内の幹線と地方交通線       | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 81条の４   | 九州内の幹線と地方交通線       | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 84条       | 営業キロが10キロ以下           | ![実装済み](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E5%AE%8C%E4%BA%86-brightgreen.svg) |
| 84条の２   | 北海道内の10キロ以下           | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 84条の３   | 四国内の１０キロ以下           | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| ８４条の４ | 九州内の１０キロ以下           | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 85条       | 他のJR線を連続して乗車         | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 85条の２   | 加算運賃の適用区間と額         | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 85条の３   | 加算運賃区間に関する運賃       | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 86条       | 特定都市内                     | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 87条       | 山手線内                       | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 88条       | 新大阪・大阪駅発着             | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 89条       | 北新地駅発着                   | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 90条       | 往復運賃・連続運賃             | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 92条       | 学割                           | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 93条       | 被救護者割引                   | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 94条       | 往復割引                       | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |


## 第4章　乗車券類の効力
### 第2節　乗車券の効力
| 番号       | 概要                     | 対応状況     |
|------------|--------------------------------|------|
| 154条 | 有効期間 | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 155条 | 継続乗車 | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 156条 | 途中下車・大都市近郊区間 | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 157条 | 選択乗車 |  ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 157条2項 | 大都市近郊区間内相互発着 | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 158条 | 特定区間における迂回乗車 | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 159条 | 特定区間を通過する場合の迂回乗車 | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |
| 160条 | 特定区間発着の場合の迂回乗車 | ![未実装](https://img.shields.io/badge/%E5%AE%9F%E8%A3%85-%E6%9C%AA%E5%AE%9F%E8%A3%85-red.svg)   |

