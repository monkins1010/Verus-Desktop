/*
MIT License

Copyright (c) 2018 - 2019 Atomic Labs, Luke Childs
Copyright (c) 2019 - 2022 Komodo Platform

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

const KOMODO_ENDOFERA = 7777777;
const LOCKTIME_THRESHOLD = 500000000;
const MIN_SATOSHIS = 1000000000;
const ONE_MONTH_CAP_HARDFORK = 1000000;
const ONE_HOUR = 60;
const ONE_MONTH = 31 * 24 * 60;
const ONE_YEAR = 365 * 24 * 60;
const DEVISOR = 10512000;
const N_S7_HARDFORK_HEIGHT = 3484958;

module.exports = (api) => {
  api.kmdCalcInterest = (locktime, value, height) => {
    const tiptime = Math.floor(Date.now() / 1000) - 777;
    const satoshis = value;
  
    // Calculate coinage
    const coinage = Math.floor((tiptime - locktime) / ONE_HOUR);
  
    // Return early if UTXO is not eligible for rewards
    if (
      (height >= KOMODO_ENDOFERA) ||
      (locktime < LOCKTIME_THRESHOLD) ||
      (satoshis < MIN_SATOSHIS) ||
      (coinage < ONE_HOUR) ||
      (!height)
    ) {
      return 0;
    }
  
    // Cap reward periods
    const limit = (height >= ONE_MONTH_CAP_HARDFORK) ? ONE_MONTH : ONE_YEAR;
    let rewardPeriod = Math.min(coinage, limit);
  
    // The first hour of coinage should not accrue rewards
    rewardPeriod -= 59;
  
    // Calculate rewards
    let rewards = Math.floor(satoshis / DEVISOR) * rewardPeriod;
  
    // Vote-KIP0001 resulted in a reduction of the AUR from 5% to 0.01%
    // https://github.com/KomodoPlatform/kips/blob/main/kip-0001.mediawiki
    // https://github.com/KomodoPlatform/komodo/pull/584
    if (height >= N_S7_HARDFORK_HEIGHT) {
      rewards = Math.floor(rewards / 500);
    }
  
    // Ensure reward value is never negative
    if (rewards < 0) {
      throw new Error('Reward should never be negative');
    }
  
    return rewards;
  };

  return api;
};