const zcashParamsSources = {
  'agama.komodoplatform.com': {
    proving: 'https://agama.komodoplatform.com/file/supernet/sprout-proving.key',
    verifying: 'https://agama.komodoplatform.com/file/supernet/sprout-verifying.key',
    spend: 'https://agama.komodoplatform.com/file/komodo/sapling-params/sapling-spend.params',
    output: 'https://agama.komodoplatform.com/file/komodo/sapling-params/sapling-output.params',
    groth16: 'https://agama.komodoplatform.com/file/komodo/sapling-params/sprout-groth16.params',
  },
  'z.cash': {
    proving: 'https://verus.io/zcparams/sprout-proving.key',
    verifying: 'https://z.cash/downloads/sprout-verifying.key',
    spend: 'https://z.cash/downloads/sapling-spend.params',
    output: 'https://z.cash/downloads/sapling-output.params',
    groth16: 'https://z.cash/downloads/sprout-groth16.params',
  },
  'verus.io': {
    proving: 'https://verus.io/zcparams/sprout-proving.key',
    verifying: 'https://verus.io/zcparams/sprout-verifying.key',
    spend: 'https://verus.io/zcparams/sapling-spend.params',
    output: 'https://verus.io/zcparams/sapling-output.params',
    groth16: 'https://verus.io/zcparams/sprout-groth16.params',
  },
}

module.exports = zcashParamsSources;
