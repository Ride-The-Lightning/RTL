export interface GetInfo {
  version?: string;
  nodeId?: string;
  alias?: string;
  color?: string;
  features?: string;
  chainHash?: string;
  network?: string;
  blockHeight?: number;
  publicAddresses?: string[];
  currency_unit?: string;
  smaller_currency_unit?: string;
  lnImplementation?: string;
}

export interface Fees {
  daily_fee?: number;
  daily_txs?: number;
  weekly_fee?: number;
  weekly_txs?: number;
  monthly_fee?: number;
  monthly_txs?: number;
  sent?: any[];
  received?: any[];
  relayed?: any[];
}

export interface Channel {
  alias?: string;
  nodeId?: string;
  channelId?: string;
  state?: string;
  data?: {
    commitments?: {
      localParams?: {
        nodeId?: string;
        channelKeyPath?: {
          path?: number[]
        },
        dustLimit?: number;
        maxHtlcValueInFlight?: number;
        channelReserve?: number;
        htlcMinimum?: number;
        toSelfDelay?: number;
        maxAcceptedHtlcs?: number;
        isFunder?: boolean;
        defaultFinalScriptPubKey?: string;
        globalFeatures?: string;
        localFeatures?: string;
      },
      remoteParams?: {
        nodeId?: string;
        dustLimit?: number;
        maxHtlcValueInFlight?: number;
        channelReserve?: number;
        htlcMinimum?: number;
        toSelfDelay?: number;
        maxAcceptedHtlcs?: number;
        fundingPubKey?: string;
        revocationBasepoint?: string;
        paymentBasepoint?: string;
        delayedPaymentBasepoint?: string;
        htlcBasepoint?: string;
        globalFeatures?: string;
        localFeatures?: string;
      },
      channelFlags?: number;
      localCommit?: {
        index?: number;
        spec?: {
          htlcs?: [],
          feeratePerKw?: number;
          toLocal?: number;
          toRemote?: number;
        },
        publishableTxs?: {
          commitTx?: string;
          htlcTxsAndSigs?: []
        }
      },
      remoteCommit?: {
        index?: number;
        spec?: {
          htlcs?: [],
          feeratePerKw?: number;
          toLocal?: number;
          toRemote?: number;
        },
        txid?: string;
        remotePerCommitmentPoint?: string;
      },
      localChanges?: {
        proposed?: [],
        signed?: [],
        acked?: []
      },
      remoteChanges?: {
        proposed?: [],
        acked?: [],
        signed?: []
      },
      localNextHtlcId?: number;
      remoteNextHtlcId?: number;
      originChannels?: any,
      remoteNextCommitInfo?: string;
      commitInput?: {
        outPoint?: string;
        amountSatoshis?: number;
      },
      remotePerCommitmentSecrets?: number;
      channelId?: string;
    },
    shortChannelId?: string;
    buried?: boolean;
    channelAnnouncement?: {
      nodeSignature1?: string;
      nodeSignature2?: string;
      bitcoinSignature1?: string;
      bitcoinSignature2?: string;
      features?: string;
      chainHash?: string;
      shortChannelId?: string;
      nodeId1?: string;
      nodeId2?: string;
      bitcoinKey1?: string;
      bitcoinKey2?: string;
    },
    channelUpdate?: {
      signature?: string;
      chainHash?: string;
      shortChannelId?: string;
      timestamp?: number;
      messageFlags?: number;
      channelFlags?: number;
      cltvExpiryDelta?: number;
      htlcMinimumMsat?: number;
      feeBaseMsat?: number;
      feeProportionalMillionths?: number;
      htlcMaximumMsat?: number;
    }
  }
}

export interface ChannelStats {
  channelId?: string;
  avgPaymentAmount?: number;
  paymentCount?: number;
  relayFee?: number;
  networkFee?: number;
}

export interface OnChainBalance {
  totalBalance?: number;
  confBalance?: number;
  unconfBalance?: number;
  btc_totalBalance?: number;
  btc_confBalance?: number;
  btc_unconfBalance?: number;
}

export interface LightningBalance {
  localBalance: number;
  remoteBalance: number;
  pendingBalance?: number;
  btc_localBalance?: number;
  btc_remoteBalance?: number;
  btc_pendingBalance?: number;
}

export interface ChannelStatus {
  channels?: number;
  capacity?:number;
}

export interface ChannelsStatus {
  active?: ChannelStatus;
  inactive?: ChannelStatus;
  pending?: ChannelStatus;
  closing?: ChannelStatus;
}

export interface Peer {
  nodeId?: string;
  state?: string;
  address?: string;
  channels?: string;
}
