import BinanceBinding from "./binding/Binance";
import CrossOverStrategy from "./strategy/CrossOver";
import Trader from "./modules/Trader";
const binance = new BinanceBinding();

const bot = new Trader(1000, 0.05, binance, CrossOverStrategy);
bot.run().then((x) => {
  console.log("a");
});
