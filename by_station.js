import "https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.min.js";

// https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/by_station/USW00014739.csv.gz
let response = await fetch(
  "https://www1.ncdc.noaa.gov/pub/data/ghcn/daily/by_station/USW00014739.csv.gz"
);

// let sleep = await new Promise((r) => setTimeout(r, 1000));
console.log(response);
let blob_compressed;
let blob_uncompressed;
let result = "";
// get the blob from the response
if (response.ok) {
  // un-gzip the blob

  let TotalSize = 0;
  let Chunks = [];
  let data_in;
  let data_out;
  blob_compressed = await response.blob();
  console.log(`blob_compressed: ${blob_compressed.size}`, blob_compressed);

  let utfDecode;
  let dcmpStrm;
  try {
    Chunks = [];

    let stringData = "";
    utfDecode = new fflate.DecodeUTF8((data, final) => {
      stringData += data;
    });
    dcmpStrm = new fflate.Decompress((chunk, final) => {
      //   console.log(chunk);
      console.log("chunk was encoded with GZIP, Zlib, or DEFLATE");
      utfDecode.push(chunk, final);
    });

    for await (const chunk of blob_compressed.stream()) {
      TotalSize += chunk.length;
      console.log(`TotalSize[35]: ${chunk.length} += ${TotalSize}`);
      dcmpStrm.push(chunk);
    }

    console.log(`TotalSize[38]: ${TotalSize}`);
    // console.log(`stringData:`, stringData);
    console.log(`stringData: ${stringData.length}`);
    result = stringData;
  } catch (e) {
    console.log("*** ERROR *** - Decompression Error: " + e);
  } finally {
    console.log("Decompression Complete");
  }

  let lines = result.split("\n");
  let firstLines = lines.slice(0, 5);
  let lastLines = lines.slice(-5);
  console.log(`result: ${result.length}, lines: ${lines.length}`);
  console.log(firstLines, lastLines);
} else {
  console.log("HTTP-Error: " + response.status);
}
