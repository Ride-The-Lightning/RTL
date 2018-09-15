var config = {};

config.lnd_server_url = 'https://localhost:8080/v1';
config.lnd_dir = '';

config.debuglevel='debug';
config.debughtlc=true;
config.maxpendingchannels=5;
config.alias='TEST_MYLN';
config.color='#68F450';

config.bitcoin = { active: 1, testnet: 1, mainnet: 1 };

// config.bitcoin = { active: 1, testnet: 1, mainnet: 1, node: neutrino };
// config.neutrino = { connect: faucet.lightning.community };
config.externalip='24.228.183.56';

config.autopilot = {active: 1, maxchannels: 5, allocation: 0.3};

module.exports = config;
