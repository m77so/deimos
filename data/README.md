# これなに
駅データを生成するスクリプトです．MARS for MS-DOSで使われているデータを元にして生成します．

# 使い方
- http://www.swa.gr.jp/pub/mars/index.html から MARS for MS-DOSをダウンロードします．
- `resource/` に 上に含まれる`MARS_NN.DAT`と`MARS_SD.DAT`を配置します．
- `(npm|yarn) install` で実行に必要なパッケージをインストールします．
- `(npm|yarn) run build` でdeimos内に`src/app/data.ts`が生成されます．
