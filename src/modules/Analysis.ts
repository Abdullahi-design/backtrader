import fs from "fs";
import {
  ApplyTo,
  Candle,
  CandlePattern,
  IndicatorLevel,
  TalibCandlePatternReturn,
  TalibFunctionReturn,
} from "../types/analysis";
const talib = require("@/../../node_modules/talib/build/Release/talib.node");

class BaseAnalysis {
  marketData: Candle[];
  depth: number;

  constructor(marketData: Candle[], depth = 1000) {
    this.depth = depth;
    this.marketData = marketData;

    this.updateMarketData(marketData);
  }

  updateMarketData(marketData: Candle[]) {
    this.marketData = marketData;
    this.marketData = this.marketData.splice(-1 * this.depth);
  }

  explain(func: string) {
    return new Promise((resolve, reject) => {
      const function_desc = talib.explain(func);
      resolve(function_desc);
    });
  }
}
export default class Analysis extends BaseAnalysis {
  constructor(marketData: Candle[], depth = 1000) {
    super(marketData, depth);
    this.depth = depth;
    this.marketData = marketData;

    this.updateMarketData(marketData);
  }

  adx(period: number): Promise<TalibFunctionReturn> {
    return new Promise((resolve, reject) => {
      talib.execute(
        {
          name: "ADX",
          startIdx: 0,
          endIdx: this.marketData.length - 1,
          high: this.marketData.map((candle) => candle.high),
          low: this.marketData.map((candle) => candle.low),
          close: this.marketData.map((candle) => candle.close),
          optInTimePeriod: period,
        },
        function (err: Object, result: TalibFunctionReturn) {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      );
    });
  }

  adxLine(period: number): Promise<IndicatorLevel[]> {
    return this.adx(period).then((adx) => {
      const adxLine = adx.result.outReal;
      adxLine.splice(0, 0, ...Array(adx.begIndex));
      return this.marketData.map((candle, index) => {
        return { timestamp: candle.timestamp, level: adxLine[index] };
      });
    });
  }

  candlePattern(pattern: string): Promise<TalibCandlePatternReturn> {
    return new Promise((resolve, reject) => {
      talib.execute(
        {
          name: pattern,
          startIdx: 0,
          endIdx: this.marketData.length - 1,
          open: this.marketData.map((candle) => candle.open),
          high: this.marketData.map((candle) => candle.high),
          low: this.marketData.map((candle) => candle.low),
          close: this.marketData.map((candle) => candle.close),
        },
        function (err: Object, result: TalibCandlePatternReturn) {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      );
    });
  }

  ema(
    period: number = 30,
    applyTo: ApplyTo = "close"
  ): Promise<TalibFunctionReturn> {
    return new Promise((resolve, reject) => {
      talib.execute(
        {
          name: "EMA",
          startIdx: 0,
          endIdx: this.marketData.length - 1,
          inReal: this.marketData.map((candle) => candle[applyTo]),
          optInTimePeriod: period,
        },
        function (err: Object, result: TalibFunctionReturn) {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      );
    });
  }

  emaLine(
    period: number = 30,
    applyTo: ApplyTo = "close"
  ): Promise<IndicatorLevel[]> {
    return this.ema(period, applyTo).then((sma) => {
      const smaLine = sma.result.outReal;
      smaLine.splice(0, 0, ...Array(sma.begIndex));
      return this.marketData.map((candle, index) => {
        return { timestamp: candle.timestamp, level: smaLine[index] };
      });
    });
  }

  twoCros(): Promise<CandlePattern[]> {
    return this.candlePattern("CDL2CROWS").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  threeCrows(): Promise<CandlePattern[]> {
    return this.candlePattern("CDL3BLACKCROWS").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  threeInsideUpDown(): Promise<CandlePattern[]> {
    return this.candlePattern("CDL3INSIDE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  threeLineStrike(): Promise<CandlePattern[]> {
    return this.candlePattern("CDL3LINESTRIKE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  threeOutsideUpDown(): Promise<CandlePattern[]> {
    return this.candlePattern("CDL3OUTSIDE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  starInTheSouth(): Promise<CandlePattern[]> {
    return this.candlePattern("CDL3STARSINSOUTH").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  advancingWhiteSoldiers(): Promise<CandlePattern[]> {
    return this.candlePattern("CDL3WHITESOLDIERS").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  abandonedBaby(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLABANDONEDBABY").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  advanceBlock(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLADVANCEBLOCK").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  beltHold(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLBELTHOLD").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  breakaway(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLBREAKAWAY").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  closingMarubozu(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLCLOSINGMARUBOZU").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  babySwallow(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLCONCEALBABYSWALL").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  counterAttack(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLCOUNTERATTACK").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  darkCloudCover(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLDARKCLOUDCOVER").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  doji(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLDOJI").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  dojiStar(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLDOJISTAR").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  dragonflyDoji(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLDRAGONFLYDOJI").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  engulfing(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLENGULFING").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  eveningDojiStar(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLEVENINGDOJISTAR").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  eveningStar(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLEVENINGSTAR").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  DUMMY(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLGAPSIDESIDEWHITE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  gravestoneDoji(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLGRAVESTONEDOJI").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  hammer(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLHAMMER").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  hangingMan(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLHANGINGMAN").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  harami(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLHARAMI").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  haramiCross(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLHARAMICROSS").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  highWaveCandle(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLHIGHWAVE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  hikkake(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLHIKKAKE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  hikkakeModified(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLHIKKAKEMOD").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  homingPigeon(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLHOMINGPIGEON").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  identicalThreeCrows(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLIDENTICAL3CROWS").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  inNeck(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLINNECK").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  invertedHammer(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLINVERTEDHAMMER").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  kicking(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLKICKING").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  kickingByLength(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLKICKINGBYLENGTH").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  ladder(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLLADDERBOTTOM").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  longLeggedDoji(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLLONGLEGGEDDOJI").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  longLine(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLLONGLINE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  marubozu(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLMARUBOZU").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  matchingLow(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLMATCHINGLOW").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  matHold(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLMATHOLD").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  morningDojiStar(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLMORNINGDOJISTAR").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  morningStart(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLMORNINGSTAR").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  onNeck(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLONNECK").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  piercingLine(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLPIERCING").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  rickshawMan(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLRICKSHAWMAN").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  risingFallingMethods(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLRISEFALL3METHODS").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  separatingLines(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLSEPARATINGLINES").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  shootingStar(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLSHOOTINGSTAR").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  shortLineCandle(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLSHORTLINE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  spinningTop(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLSPINNINGTOP").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  stalled(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLSTALLEDPATTERN").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  stickSandwich(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLSTICKSANDWICH").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  takuri(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLTAKURI").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  tasuki(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLTASUKIGAP").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  thrusting(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLTHRUSTING").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  tristar(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLTRISTAR").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  uniqueThreeRiver(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLUNIQUE3RIVER").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  upsideGap2(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLUPSIDEGAP2CROWS").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  upsideGap3(): Promise<CandlePattern[]> {
    return this.candlePattern("CDLXSIDEGAP3METHODS").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  // I started here

  chandeMomentumOscillator(): Promise<CandlePattern[]> {
    return this.candlePattern("CMO").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }
  pearsonCorrelationCoefficient(): Promise<CandlePattern[]> {
    return this.candlePattern("CORREL").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  doubleExponentialMovingAverage(): Promise<CandlePattern[]> {
    return this.candlePattern("DEMA").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  directionalMovementIndex(): Promise<CandlePattern[]> {
    return this.candlePattern("DX ").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  hilbertTransformDominantCyclePeriod(): Promise<CandlePattern[]> {
    return this.candlePattern("HT_DCPERIOD ").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  hilbertTransformDominantCyclePhase(): Promise<CandlePattern[]> {
    return this.candlePattern("HT_DCPHASE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  hilbertTransformPhasorComponents(): Promise<CandlePattern[]> {
    return this.candlePattern("HT_PHASOR").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  hilbertTransformSineWave(): Promise<CandlePattern[]> {
    return this.candlePattern("HT_SINE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  hilbertTransformInstantaneousTrendline(): Promise<CandlePattern[]> {
    return this.candlePattern("HT_TRENDLINE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  hilbertTransformTrendvsCycleMode(): Promise<CandlePattern[]> {
    return this.candlePattern("HT_TRENDMODE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  kaufmanAdaptiveMovingAverage(): Promise<CandlePattern[]> {
    return this.candlePattern("KAMA").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  linearRegression(): Promise<CandlePattern[]> {
    return this.candlePattern("LINEARREG").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  linearRegressionAngle(): Promise<CandlePattern[]> {
    return this.candlePattern("LINEARREG_ANGLE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  linearRegressionIntercept(): Promise<CandlePattern[]> {
    return this.candlePattern("LINEARREG_INTERCEPT").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  linearRegressionSlope(): Promise<CandlePattern[]> {
    return this.candlePattern("LINEARREG_SLOPE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  allMovingAverage(): Promise<CandlePattern[]> {
    return this.candlePattern("MA").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  movingAverageConvergenceDivergence(): Promise<CandlePattern[]> {
    return this.candlePattern("MACD").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  MACDwithcontrollableMAtype(): Promise<CandlePattern[]> {
    return this.candlePattern("MACDEXT").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  movingAverageConvergenceDivergenceFix(): Promise<CandlePattern[]> {
    return this.candlePattern("MACDFIX").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  MESAAdaptiveMovingAverage(): Promise<CandlePattern[]> {
    return this.candlePattern("MAMA ").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  highestvalueoveraspecifiedperiod(): Promise<CandlePattern[]> {
    return this.candlePattern("MAX").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  Indexofhighestvalueoveraspecifiedperiod(): Promise<CandlePattern[]> {
    return this.candlePattern("MAXINDEX").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  medianPrice(): Promise<CandlePattern[]> {
    return this.candlePattern("MEDPRICE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  moneyFlowIndex(): Promise<CandlePattern[]> {
    return this.candlePattern("MFI").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  midPointOverPeriod(): Promise<CandlePattern[]> {
    return this.candlePattern("MIDPOINT").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  midpointPriceOverPeriod(): Promise<CandlePattern[]> {
    return this.candlePattern("MIDPRICE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  lowestValueOverASpecifiedPeriod(): Promise<CandlePattern[]> {
    return this.candlePattern("MIN").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  indexOfLwestValueOverASpecifiedPeriod(): Promise<CandlePattern[]> {
    return this.candlePattern("MININDEX ").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  LowestAndHighestValuesOverASpecifiedPeriod(): Promise<CandlePattern[]> {
    return this.candlePattern("MINMAX ").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  indexesofLowestAndHighestValuesOverASpecifiedPeriod(): Promise<CandlePattern[]> {
    return this.candlePattern("MINMAXINDEX").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }
  minusDirectionalIndicator(): Promise<CandlePattern[]> {
    return this.candlePattern("MINUS_DI").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  minusDirectionalMovement(): Promise<CandlePattern[]> {
    return this.candlePattern("MINUS_DM").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  Momentum(): Promise<CandlePattern[]> {
    return this.candlePattern("MOM").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  normalizedAverageTrueRange(): Promise<CandlePattern[]> {
    return this.candlePattern("NATR").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  onBalanceVolume(): Promise<CandlePattern[]> {
    return this.candlePattern("OBV").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  plusDirectionalIndicator(): Promise<CandlePattern[]> {
    return this.candlePattern("PLUS_DI").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  percentagePriceOscillator(): Promise<CandlePattern[]> {
    return this.candlePattern("PPO").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  rateOfChange(): Promise<CandlePattern[]> {
    return this.candlePattern("ROC").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  rateOChangeRatio(): Promise<CandlePattern[]> {
    return this.candlePattern("ROCR").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  rateOfChangeRatio100Scale(): Promise<CandlePattern[]> {
    return this.candlePattern("ROCR100").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  relativeStrengthIndex(): Promise<CandlePattern[]> {
    return this.candlePattern("RSI").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  parabolicSAR(): Promise<CandlePattern[]> {
    return this.candlePattern("SAR").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  parabolicSARExtended(): Promise<CandlePattern[]> {
    return this.candlePattern("SAREXT").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  simpleMovingAverage(): Promise<CandlePattern[]> {
    return this.candlePattern("SMA").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  standardDeviation(): Promise<CandlePattern[]> {
    return this.candlePattern("STDDEV").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  Stochastic(): Promise<CandlePattern[]> {
    return this.candlePattern("STOCH").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  stochasticFast(): Promise<CandlePattern[]> {
    return this.candlePattern("STOCHF").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  stochasticRelativeStrengthIndex(): Promise<CandlePattern[]> {
    return this.candlePattern("STOCHRSI").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  Summation(): Promise<CandlePattern[]> {
    return this.candlePattern("SUM").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  ripleExponentialMovingAverage(): Promise<CandlePattern[]> {
    return this.candlePattern("T3").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  tripleExponentialMovingAverage(): Promise<CandlePattern[]> {
    return this.candlePattern("TEMA").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  trueRange(): Promise<CandlePattern[]> {
    return this.candlePattern("TRANGE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  triangularMovingAverage(): Promise<CandlePattern[]> {
    return this.candlePattern("TRIMA").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  oneDayRateOfChangeROCOfATripleSmoothEMA(): Promise<CandlePattern[]> {
    return this.candlePattern("TRIX").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  timeSeriesForecast(): Promise<CandlePattern[]> {
    return this.candlePattern("TSF").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  typicalPrice(): Promise<CandlePattern[]> {
    return this.candlePattern("TYPPRICE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  ultimateOscillator(): Promise<CandlePattern[]> {
    return this.candlePattern("ULTOSC").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  Variance(): Promise<CandlePattern[]> {
    return this.candlePattern("VAR").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  weightedClosePrice(): Promise<CandlePattern[]> {
    return this.candlePattern("WCLPRICE").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  WilliamsPercentageR(): Promise<CandlePattern[]> {
    return this.candlePattern("WILLR").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  weightedMovingAverage(): Promise<CandlePattern[]> {
    return this.candlePattern("WMA").then(
      (confidence: TalibCandlePatternReturn) => {
        const points = confidence.result.outInteger;
        points.splice(0, 0, ...Array(confidence.begIndex));
        return this.marketData
          .map((candle, index) => {
            return {
              timestamp: candle.timestamp,
              confidence: points[index],
              price: this.marketData[index + 1]?.open,
            };
          })
          .filter((point) => point.confidence > 0);
      }
    );
  }

  
  
// STOPED HERE

  bullishSignal(lookBack: number) {
    return Promise.all([
      this.engulfing(),
      this.piercingLine(),
      this.advancingWhiteSoldiers(),
      this.invertedHammer(),
      this.hammer(),
    ]).then((patterns) => {
      const [engulfing, piercing, whiteSoldier, invertedHammer, hammer] =
        patterns;

      return { engulfing, piercing, whiteSoldier, invertedHammer, hammer };
    });
  }

  rsi(
    period: number = 14,
    applyTo: ApplyTo = "close"
  ): Promise<TalibFunctionReturn> {
    return new Promise((resolve, reject) => {
      talib.execute(
        {
          name: "RSI",
          startIdx: 0,
          endIdx: this.marketData.length - 1,
          inReal: this.marketData.map((candle) => candle[applyTo]),
          optInTimePeriod: period,
        },
        function (err: Object, result: TalibFunctionReturn) {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      );
    });
  }

  rsiLine(
    period: number = 14,
    applyTo: ApplyTo = "close"
  ): Promise<IndicatorLevel[]> {
    return this.rsi(period, applyTo).then((rsi) => {
      const rsiLine = rsi.result.outReal;
      rsiLine.splice(0, 0, ...Array(rsi.begIndex));
      return this.marketData.map((candle, index) => {
        return { timestamp: candle.timestamp, level: rsiLine[index] };
      });
    });
  }

  sma(
    period: number = 30,
    applyTo: ApplyTo = "close"
  ): Promise<TalibFunctionReturn> {
    return new Promise((resolve, reject) => {
      talib.execute(
        {
          name: "SMA",
          startIdx: 0,
          endIdx: this.marketData.length - 1,
          inReal: this.marketData.map((candle) => candle[applyTo]),
          optInTimePeriod: period,
        },
        function (err: Object, result: TalibFunctionReturn) {
          if (err) {
            return reject(err);
          }
          resolve(result);
        }
      );
    });
  }

  smaLine(
    period: number = 30,
    applyTo: ApplyTo = "close"
  ): Promise<IndicatorLevel[]> {
    return this.sma(period, applyTo).then((sma) => {
      const smaLine = sma.result.outReal;
      smaLine.splice(0, 0, ...Array(sma.begIndex));
      return this.marketData.map((candle, index) => {
        return { timestamp: candle.timestamp, level: smaLine[index] };
      });
    });
  }
}
