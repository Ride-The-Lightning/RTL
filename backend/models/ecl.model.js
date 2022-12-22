export var ECLWSEventsEnum;
(function (ECLWSEventsEnum) {
    ECLWSEventsEnum["PAY_RECEIVED"] = "payment-received";
    ECLWSEventsEnum["PAY_RELAYED"] = "payment-relayed";
    ECLWSEventsEnum["PAY_SENT"] = "payment-sent";
    ECLWSEventsEnum["PAY_SETTLING_ONCHAIN"] = "payment-settling-onchain";
    ECLWSEventsEnum["PAY_FAILED"] = "payment-failed";
    ECLWSEventsEnum["CHANNEL_OPENED"] = "channel-opened";
    ECLWSEventsEnum["CHANNEL_STATE_CHANGED"] = "channel-state-changed";
    ECLWSEventsEnum["CHANNEL_CLOSED"] = "channel-closed";
    ECLWSEventsEnum["ONION_MESSAGE_RECEIVED"] = "onion-message-received";
})(ECLWSEventsEnum || (ECLWSEventsEnum = {}));
