const axios = require('axios');
const cliProgress = require('cli-progress');
const dayjs = require('dayjs');
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
dayjs.extend(isSameOrBefore);
const params = require('./params.json');

console.log(params.start);

// 指定した日付範囲を生成する関数
const generateDates = (startDate, endDate) => {
  const dates = [];
  let current = dayjs(startDate);
  const end = dayjs(endDate);

  while (current.isSameOrBefore(end)) {
    dates.push(current.format('YYYYMMDD'));
    current = current.add(1, 'day'); // 1日ずつ進める
  }
  return dates;
}

// ファイルが存在するかチェックする関数
const checkFileExists = async (url) => {
  try {
    const response = await axios.head(url);
    return response.status === 200; // ステータス200なら存在
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return false; // ステータス404なら存在しない
    } else {
      console.error(`エラー: ${url}`, error.message);
      return false;
    }
  }
}

// メイン関数
const main = async () => {
  const baseUrl = params.url;
  const startDate = params.start;
  const endDate =  params.end;
  const names = params.names

  const dates = generateDates(startDate, endDate);
  console.log(`チェックする名前の数: ${names.length}`);
  console.log(`チェックする日付の数: ${dates.length}`);

  let existsFiles = [];

  for (const name of names) {
    const progressBar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
    progressBar.start(dates.length, 0);

    for (const [index, date] of dates.entries()) {
      const fileName = `${name}_${date}.mp4`;
      const url = `${baseUrl}${fileName}`;
      const exists = await checkFileExists(url);
      if (exists) {
        console.log(`exists: ${fileName}`);
        existsFiles.push(fileName);
      }
      progressBar.update(index + 1);
    }

    progressBar.stop();
  }

  // 存在するURLを `exists.json` に書き込む
  if (existsFiles.length > 0) {
    fs.writeFileSync('exists.json', JSON.stringify({ files: existsFiles }, null, 2), 'utf8');
    console.log(`存在するファイル名は exists.json に書き込まれました。`);
  } else {
    console.log('存在するファイルはありませんでした。');
  }
}

main();
