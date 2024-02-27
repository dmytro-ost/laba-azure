const { BlobServiceClient } = require('@azure/storage-blob');
const { ImageAnalysisClient } = require('@azure-rest/ai-vision-image-analysis');
const createClient = require('@azure-rest/ai-vision-image-analysis').default;
const { AzureKeyCredential } = require('@azure/core-auth');

const endpoint = process.env['VISION_ENDPOINT'];
const key = process.env['VISION_KEY'];
const credential = new AzureKeyCredential(key);
const client = createClient(endpoint, credential);

const features = ['Caption', 'DenseCaptions', 'Read', 'Tags'];

async function analyzeImageFromUrl(imageUrl) {
  const result = await client.path('/imageanalysis:analyze').post({
    body: {
      url: imageUrl
    },
    queryParameters: {
      features: features,
      'language': 'en'
    },
    contentType: 'application/json'
  });

  return result.body;
}

const btnGetInfo = document.getElementById('btn-get-info');
const inputUrl = document.getElementById('input-url');
const outputContainer = document.getElementById('output');

btnGetInfo.addEventListener('click', async () => {
  if (!inputUrl.value.trim()) {
    return;
  }

  const url = inputUrl.value.trim();
  inputUrl.value = '';

  const result = await analyzeImageFromUrl(url);
  if (result && result.error) {
    outputContainer.innerHTML = `<h3>Невірний формат зображення або помилка запита. ${result.error.message}</h3>`;
    return;
  }

  outputContainer.innerHTML = formatOutput(url, result);
});

function formatOutput(url, src) {
  let output = `<img class="img" src=${url}><h4>Опис зображення:</h4>`;
  output += `<div class="description">`;
  src.denseCaptionsResult.values.forEach((element, i) => {
    output += `<h6>${i + 1}. ${element.text}. Достовірність: ${
      (element.confidence * 100).toFixed(2)
    }%</h6>`;
  });
  output += '</div><hr>';

  let text = '';
  src.readResult.blocks.forEach((block) => {
    block.lines.forEach((line) => {
      text += `<h5>${line.text}</h5>`;
    });
    text += '<hr>';
  });
  output += text ? '<h4>Розпізнавання тексту:</h4>' + text : '';

  let tag = '<b>Теги: </b> ';
  src.tagsResult.values.forEach((val) => {
    tag += `<em>${val.name} ${(val.confidence * 100).toFixed(2)}%</em> `;
  });

  output += tag;

  return output;
}
