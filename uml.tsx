const express = require("express");
const cors = require("cors");
const fs = require("fs");
const fileName = "./file.json";
const file = require(fileName);
const app = express();
// const basefile = require("./baseOutput.txt");
app.use(
  cors({
    origin: /^http:\/\/localhost:[0-9]+$/,
    credentials: true,
  })
);
app.use(express.json());
function deleteMatchingFiles() {
  const regex = /^(FS1H_V18|FS1F_V18|FS1D|EL3).*\.txt$/i;

  // Get the list of files in the current directory
  fs.readdir(".", (err, files) => {
    if (err) console.log(err);

    // Filter the list of files to match the regex
    const matchingFiles = files.filter((file) => regex.test(file));

    // Delete the matching files
    matchingFiles.forEach((file) => {
      fs.unlink(file, (err) => {
        if (err) console.log(err);
        console.log(`${file} deleted successfully`);
      });
    });
  });
}

function generateFileName(A, B) {
  return A + "-" + B + ".txt";
}

function generateA(fileName) {
  console.log(fileName, "asdfas");
  if (fileName === "1MMIC_baseFile.txt") {
    return "EL3";
  } else if (fileName === "1MMIC_baseFile2.txt") {
    return "FS1D";
  } else if (fileName === "1MMIC_baseFileV18.txt") {
    return "FS1H_V18";
  } else if (fileName === "1MMIC_baseFileV18_dummy4.txt") {
    return "FS1F_V18";
  } else {
    return "";
  }
}

function generateB(
  BW,
  outputFreq,
  gain,
  isRaw,
  rangeBin,
  isReal,
  interChirp,
  mipiHeader,
  w_forceTxStart
) {
  let B = "";
  const freqMHz = Math.floor(outputFreq);
  const binType = isRaw ? "TD" : "FFT";
  const dataType = isReal ? "R_" : "C_";
  const header = mipiHeader ? "_header" : "";
  const forceTxStart = w_forceTxStart == 1 ? "_force" : "";

  B += Math.floor(BW / 1000) + "G_";
  B += freqMHz + "MHz_";
  B += gain + "dB_";
  B += binType + rangeBin + "bin_";
  B += dataType + interChirp + "us";
  B += header + forceTxStart;

  return B;
}

function generateTextFileName(
  fileName,
  BW,
  outputFreq,
  gain,
  isRaw,
  rangeBin,
  isReal,
  interChirp,
  mipiHeader,
  w_forceTxStart
) {
  const A = generateA(fileName);
  const B = generateB(
    BW,
    outputFreq,
    gain,
    isRaw,
    rangeBin,
    isReal,
    interChirp,
    mipiHeader,
    w_forceTxStart
  );
  console.log(A, "asdfas");
  const textFileName = generateFileName(A, B);
  return textFileName;
}

app.get("/get_config", (req, res) => {
  const regex = /^(FS1H_V18|FS1F_V18|FS1D|EL3).*\.txt$/i;
  const html = `
    <div id="myDialog">
      <p>Sorry config file not found, Please retry ?</p>
      <button id="okButton">OK</button>
    </div>
  `;

  const css = `
    #myDialog {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      padding: 20px;
      border: 1px solid black;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
      z-index: 9999;
    }

    #myDialog p {
      margin: 0 0 10px 0;
    }

    #myDialog button {
      padding: 10px 20px;
      background-color: blue;
      color: white;
      border: none;
      cursor: pointer;
    }

    #myDialog button:hover {
      background-color: darkblue;
    }
  `;

  const js = `
    const dialog = document.getElementById('myDialog');
    const okButton = document.getElementById('okButton');

    okButton.addEventListener('click', function() {
      window.close();
    });

    dialog.style.display = 'block';
  `;

  const response = `
    <html>
      <head>
        <style>${css}</style>
      </head>
      <body>
        ${html}
        <script>${js}</script>
      </body>
    </html>
  `;

  fs.readdir(".", (err, files) => {
    try {
      if (err) throw err;
      const matchingFiles = files.filter((file) => regex.test(file))[0];
      if (matchingFiles) res.download(matchingFiles);
      else throw new Error("No file found");
    } catch (e) {
      console.log("error occured");
      res.send(response);
    }
  });
});

app.get("/chirp", (req, res) => {
  const config_file = "./config.json";
  var config_load = JSON.parse(fs.readFileSync(config_file, "utf8"));
  file.visualizer = "false";
  res.json({ config_files: Object.keys(config_load), files: config_load });
});
app.post("/save_data", (req, res) => {
  try {
    var fs = require("fs");
    fs.readFile("inputs/" + req.body["filename"], "utf8", function (err, data) {
      if (err) {
        console.log(err);
        res.status(404).json({
          status: false,
          error: { message: "File not found", code: 404 },
        });
      }
      flag = 0;
      var result = 0;
      for (let key in req.body["data"]) {
        const search = "<" + key + ">";
        const replacer = new RegExp(search, "g");
        if (flag == 0) {
          result = data.replace(replacer, req.body["data"][key].toString());
          flag = 1;
        } else {
          result = result.replace(replacer, req.body["data"][key].toString());
        }
      }
      fs.writeFile(
        "outputs/" + req.body["outFileName"],
        result,
        "utf8",
        function (err) {
          if (err) return console.log(err);
        }
      );
      res.json({ status: true });
    });
  } catch (error) {
    res.json({ status: false });
  }
});
app.get("/visualizer", (req, res) => {
  //Serialize as JSON and Write it to a file
  file.visualizer = "true";
  fs.writeFile(fileName, JSON.stringify(file), function writeJSON(err) {
    if (err) return console.log(err);
    console.log(JSON.stringify(file));
    console.log("writing to " + fileName);
  });
  res.json({ message: "!" });
});
app.get("/load_config", (req, res) => {
  //Serialize as JSON and Write it to a file
  try {
    file.visualizer = "true";
    fs.writeFile(fileName, JSON.stringify(file), function writeJSON(err) {
      if (err) return console.log(err);
      console.log(JSON.stringify(file));
      console.log("writing to " + fileName);
    });
    res.json({ message: "!" });
  } catch (error) { }
});
app.post("/write_data", (req, res) => {
  const c = 300000000;
  let rangeBin = 1024;
  const velocityMax = 5;
  function MIPITransferTimeCalc(FRAME_DATA_SIZE, RAMP, DATARATE, DATALANE) {
    return ((FRAME_DATA_SIZE / RAMP) * 8) / (DATALANE * DATARATE);
  }
  function frameDataSizeCalc(RANGE, RAMP, Rx, typeRawOrCompress) {
    return RANGE * RAMP * Rx * (typeRawOrCompress == "Raw" ? 4 : 2);
  }
  //fix this formula
  function velocityMaxCalc(velocity) {
    const bottom = 3600;
    const upper = velocity * 1000;
    return upper / bottom;
  }
  function rangeResCalculation(
    effectiveBW,
    upSweepTime,
    outputFrequency,
    wFFTSize
  ) {
    return (
      c /
      (2 * (effectiveBW / (upSweepTime * outputFrequency)) * wFFTSize * 10 ** 6)
    );
  }
  function wFFTSizeCalc(wNumSamples, typeRealOrComplex, typeRawOrCompress) {
    return (
      wNumSamples *
      (typeRealOrComplex == "Real" ? (typeRawOrCompress == "Raw" ? 1 : 2) : 1)
    );
  }
  function wNumSamplesCalc(rangeBin, typeRealOrComplex, typeRawOrCompress) {
    return (
      rangeBin *
      (typeRealOrComplex == "Real" ? (typeRawOrCompress == "Raw" ? 2 : 1) : 1)
    );
  }
  function nRampsCalc(ramp, Tx) {
    return ramp * Tx;
  }
  function upSweepTimeCalc(wFFTSize, outputFrequency, pilSettingTime) {
    return Number(
      (
        Math.ceil((wFFTSize / outputFrequency + pilSettingTime) / 0.4) * 0.4
      ).toFixed(2)
    );
  }
  function downSweepTimeCalc(upSweep) {
    return Number(upSweep / Math.floor(upSweep / 5));
  }
  function downHoldTimeCalc(interChip, upSweepTime, upHoldTime, downHoldTime) {
    return (
      Math.ceil(interChip / 0.4) * 0.4 -
      (upSweepTime + upHoldTime + downHoldTime)
    );
  }
  function upHoldTimeCalc() {
    return 0;
  }
  function effectiveBWCalc(BW, upSweepTime, outputFrequency, wFFTSize) {
    return Math.floor((BW * (upSweepTime * outputFrequency)) / wFFTSize);
  }
  function centerFrequencyCalc(rfFrequency) {
    return rfFrequency;
  }
  function fStartFrequencyCalc(rfFrequency, BW) {
    return rfFrequency - (BW * 10 ** -3) / 2;
  }
  function interChipTimeUSCalc(interChip) {
    return Math.ceil(interChip / 0.4) * 0.4;
  }
  function fSamplingRateCalc() {
    return 112.5;
  }
  function wAdcChEnCalc(typeRealOrComplex) {
    return typeRealOrComplex == "Real" ? "0x0055" : "0x00FF";
  }
  function CompressionCFGWModeCalc(typeRawOrCompress) {
    return typeRawOrCompress == "Raw" ? 0 : 6;
  }
  function IQCorrectionCalc(typeRealOrComplex) {
    return 1, 0, typeRealOrComplex == "Real" ? 0 : 1;
  }
  function outputFormatCalc() {
    return 3;
  }
  function FFTCalc(typeRawOrCompress) {
    return typeRawOrCompress == "Raw" ? "FFTDISABLE" : "FFTENABLE";
  }
  function wHeaderEnableCalc(MIPIHeader) {
    return MIPIHeader == "Enable" ? 1 : 0;
  }
  function numBytesPerPacketCalc(typeRawOrCompress, wNumSamples) {
    return (typeRawOrCompress == "Raw" ? 4 : 2) * wNumSamples;
  }
  function wForceTxStartCalc() {
    return 0;
  }
  function wNumLanesCalc() {
    return 4;
  }
  function wDataRateCalc(
    wNumSamples,
    nRamps,
    typeRawOrCompress,
    Rx,
    interChip,
    numLanes
  ) {
    let some =
      (wNumSamples * nRamps * (typeRawOrCompress == "Raw" ? 4 : 2) * Rx * 8) /
      (Math.ceil(interChip / 0.4) * 0.4 * nRamps) /
      numLanes;
    return some > 900 ? 1350 : 900;
  }
  function syncDelayCalc(pilSettingTime, fSamplingRate, DFEwMode) {
    return ((310 / fSamplingRate).toFixed(2));
    // let temp = DFEwMode == 1 ? 92 : DFEwMode == 2 ? 46 : DFEwMode == 3 ? 24 : 17;
    // return Math.round(pilSettingTime * fSamplingRate + temp);
  }

  function velocityMaxKMh(rfFrequency, interChip, rampToRamp) {
    const upper = c * 60 * 60 * 1000000;
    const lower = rfFrequency * 1000000000 * 4 * interChip * 1000 * rampToRamp;
    return (upper / lower).toFixed(2);
  }

  let UPHOLD = req.body.UPHOLD;
  let BW = req.body.BW;
  let typeRealOrComplex = req.body.typeRealOrComplex;
  let rfFrequency = BW <= 1000 ? 76.5 : 79;
  let Gain = req.body.GAIN;
  rangeBin = req.body.rangeBin;
  let interChip = req.body.interChip;
  let ramp = req.body.ramp;
  let typeRawOrCompress = req.body.typeRawOrCompress;
  let outputFrequency = req.body.outputFrequency;
  let Rx = req.body.Rx;
  let Tx = req.body.Tx;
  let MIPIHeader = req.body.MIPIHeader;
  let pilSettingTime = req.body.pilSettingTime;
  let rampToRamp = req.body.RAMPTORAMP;

  let tableDefault1 = {
    43: [0, 1, 1],
    34: [1, 0, 3],
    24: [3, 1, 3],
  };
  let tableDefault2 = {
    28.125: [1, 0], //null],
    56.25: [2, 6],
    112.5: [3, 4],
  };
  function DFEwModeCalc(outputFrequency, typeRealOrComplex) {
    return tableDefault2[outputFrequency][typeRealOrComplex == "Real" ? 0 : 1];
  }
  function GainCalc(gain, col_index) {
    return tableDefault1[gain][col_index - 2];
  }
  const CF = centerFrequencyCalc(rfFrequency);
  const RFGAIN = GainCalc(Gain, 2);
  const IFGAIN = GainCalc(Gain, 3);
  const IFA1GAIN = GainCalc(Gain, 4);
  const RAMP = nRampsCalc(ramp, Tx);
  const RANGE = wNumSamplesCalc(rangeBin, typeRealOrComplex, typeRawOrCompress);
  const SAMPLE = wFFTSizeCalc(RANGE, typeRealOrComplex, typeRawOrCompress);
  const IQ_RR = 1;
  const IQ_RI = 0;
  const IQ_II = IQCorrectionCalc(typeRealOrComplex);
  const DFEMODE = DFEwModeCalc(outputFrequency, typeRealOrComplex);
  const SYNCDELAY = syncDelayCalc(pilSettingTime, fSamplingRateCalc(), DFEMODE);
  const UPSWEEP = upSweepTimeCalc(SAMPLE, outputFrequency, pilSettingTime);
  UPHOLD = req.body.UPHOLD;
  const DOWNSWEEP = downSweepTimeCalc(UPSWEEP);
  BW = effectiveBWCalc(BW, UPSWEEP, outputFrequency, SAMPLE);
  const DOWNHOLD = downHoldTimeCalc(interChip, UPSWEEP, UPHOLD, DOWNSWEEP);
  const DATALANE = wNumLanesCalc();
  const STFREQ = fStartFrequencyCalc(rfFrequency, BW);
  const INTERCHIRP = interChipTimeUSCalc(interChip);
  const ADCCHEN = wAdcChEnCalc(typeRealOrComplex);
  const ADC = fSamplingRateCalc();
  const DATARATE = wDataRateCalc(
    RANGE,
    RAMP,
    typeRawOrCompress,
    Rx,
    interChip,
    DATALANE
  );
  const TX_START = wForceTxStartCalc();
  const BURSTSIZE = numBytesPerPacketCalc(typeRawOrCompress, RANGE);
  const HEADER = wHeaderEnableCalc(MIPIHeader);
  const FFT = FFTCalc(typeRawOrCompress);
  const OUTFORMAT = outputFormatCalc();
  const CMPMODE = CompressionCFGWModeCalc(typeRawOrCompress);
  const RANGE_RES = rangeResCalculation(BW, UPSWEEP, outputFrequency, SAMPLE);
  const VELOCITY_MAX_KMH = Number(
    velocityMaxKMh(rfFrequency, interChip, rampToRamp)
  );
  const VELOCITY_MAX = velocityMaxCalc(VELOCITY_MAX_KMH);
  let RANGE_MAX = rangeBin * RANGE_RES;
  const FRAME_DATA_SIZE = frameDataSizeCalc(RANGE, RAMP, Rx);
  const MIPITransferTime = MIPITransferTimeCalc(
    FRAME_DATA_SIZE,
    RAMP,
    DATARATE,
    Number(req.body.DATALANE)
  );
  const SLOPE_FREQUENCY = BW / UPSWEEP;
  const params = {
    RAMP: RAMP,
    RANGE: RANGE,
    SAMPLE: SAMPLE,
    IQ_II: IQ_II,
    DFEMODE: DFEMODE,
    SYNCDELAY: SYNCDELAY,
    UPSWEEP: Number(UPSWEEP.toFixed(2)),
    UPHOLD: UPHOLD,
    DOWNSWEEP: Number(DOWNSWEEP.toFixed(2)),
    DOWNHOLD: Number(DOWNHOLD.toFixed(2)),
    BW: BW,
    STFREQ: Number(STFREQ.toFixed(4)),
    INTERCHIRP: INTERCHIRP,
    ADCCHEN: ADCCHEN,
    ADC: ADC,
    CF: Number(CF.toFixed(3)),
    CMPMODE: CMPMODE,
    RFGAIN: RFGAIN,
    IFGAIN: IFGAIN,
    IFA1GAIN: IFA1GAIN,
    OUTFORMAT: OUTFORMAT,
    FFT: FFT,
    HEADER: HEADER,
    BURSTSIZE: BURSTSIZE,
    DATARATE: DATARATE,
    RANGE_RES: Number(RANGE_RES.toFixed(3)),
    RANGE_MAX: Number(RANGE_MAX.toFixed(3)),
    VELOCITY_MAX: Number(VELOCITY_MAX.toFixed(3)),
    VELOCITY_RES: Number((((VELOCITY_MAX / ramp) * 5) / 18).toFixed(3)),
    VELOCITY_MAX_KMH,
    RF_FREQUENCY: Number(rfFrequency.toFixed(3)),
    MIPITransferTime: Number(MIPITransferTime.toFixed(3)),
    SLOPE_FREQUENCY: Number(SLOPE_FREQUENCY.toFixed(3)),
    //dummy data
    TX_START: Number(req.body.TX_START),
    DATALANE: Number(req.body.DATALANE),
    IQ_RI: Number(req.body.IQ_RI),
    IQ_RR: Number(req.body.IQ_RR),
    currentConfig: req.body.currentConfig,
  };

  const fileName = req.body.currentConfig;
  const outputFreq = outputFrequency;
  const gain = Gain;
  const isRaw = req.body.typeRawOrCompress == "Raw" ? true : false;
  const isReal = req.body.typeRealOrComplex == "Real" ? true : false;
  const interChirp = req.body.interChip;
  const mipiHeader = req.body.MIPIHeader == "Enable" ? true : false;
  const w_forceTxStart = req.body.TX_START === 1 ? true : false;

  const textFileName = generateTextFileName(
    fileName,
    BW,
    outputFreq,
    gain,
    isRaw,
    rangeBin,
    isReal,
    interChirp,
    mipiHeader,
    w_forceTxStart
  );

  // fs.unlink("./output.txt", (err) => {
  //   console.log(err);
  // });

  deleteMatchingFiles();

  fs.readFile("./baseOutput.txt", "utf8", (err, data) => {
    if (err) {
      console.log(err);
    } else {
      let updatedData = data;
      for (let key in params) {
        const regex = new RegExp(`<${key}>`, "g");
        updatedData = updatedData.replace(regex, params[key]);
      }
      fs.writeFile(textFileName, updatedData, (err) => {
        if (err) {
          console.log(err);
        }
      });
    }
  });

  res.json(params);
});

app.listen(8500, () => {
  console.log(`Server is running on port 8500. Process id - ${process.pid}`);
});
