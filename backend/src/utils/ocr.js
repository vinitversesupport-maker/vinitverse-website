const { createWorker } = require('tesseract.js');
const path = require('path');

// Simple wrapper around tesseract.js
module.exports = async function ocrRecognize(filePath){
  // filePath: absolute or relative path to file
  const worker = createWorker({ logger: m => {/* optional logging */} });
  try{
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    const { data } = await worker.recognize(filePath);
    // compute average confidence from words if available (0-100)
    let confidence = 0;
    if (data && Array.isArray(data.words) && data.words.length>0){
      const sum = data.words.reduce((s,w)=>s + (w.confidence||0), 0);
      confidence = sum / data.words.length / 100; // normalize to 0-1
    } else if (data && typeof data.confidence === 'number'){
      confidence = data.confidence / 100;
    }
    return { text: data.text || '', confidence };
  } finally {
    try{ await worker.terminate(); }catch(e){}
  }
}
