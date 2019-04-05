FROM ubuntu:18.04

RUN apt-get -qq update && apt-get install -y software-properties-common

RUN add-apt-repository -y ppa:bitcoin/bitcoin \
  && add-apt-repository -y universe && apt-get update

RUN apt-get install -y bitcoind

ADD ./bitcoin.conf /bitcoin/bitcoin.conf
