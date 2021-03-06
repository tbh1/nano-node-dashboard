import React, { Fragment } from "react";
import _ from "lodash";
import accounting from "accounting";
import injectClient from "../../lib/ClientComponent";

import AggregateNetworkData from "../partials/AggregateNetworkData";
import BlockByTypeStats from "../partials/BlockByTypeStats";
import PeerVersions from "../partials/PeerVersions";

const MAX_SUPPLY = 133248289;
const REBROADCASTABLE_THRESHOLD = MAX_SUPPLY * 0.0001;

class NetworkStatus extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      blocksByType: {},
      peers: {},
      representativesOnline: {},
      officialRepresentatives: {}
    };

    this.statTimer = null;
  }

  componentWillMount() {
    this.updateStats();
  }

  componentWillUnmount() {
    if (this.statTimer) clearTimeout(this.statTimer);
  }

  async updateStats() {
    this.setState({
      blocksByType: await this.props.client.blockCountByType(),
      peers: await this.props.client.peers(),
      representativesOnline: await this.props.client.representativesOnline(),
      officialRepresentatives: await this.props.client.officialRepresentatives()
    });

    this.statTimer = setTimeout(this.updateStats.bind(this), 10000);
  }

  rebroadcastableReps() {
    const { representativesOnline } = this.state;
    return _.fromPairs(
      _.toPairs(representativesOnline).filter(rep => {
        return parseFloat(rep[1], 10) >= REBROADCASTABLE_THRESHOLD;
      })
    );
  }

  onlineWeight() {
    const { representativesOnline } = this.state;
    return _.sum(
      _.values(representativesOnline).map(amt => parseFloat(amt, 10))
    );
  }

  officialWeight() {
    const { officialRepresentatives } = this.state;
    return _.sum(
      _.values(officialRepresentatives).map(amt => parseFloat(amt, 10))
    );
  }

  amountRepresented() {
    return (
      <Fragment>{accounting.formatNumber(this.onlineWeight())} NANO</Fragment>
    );
  }

  percentRepresented() {
    return (
      <Fragment>
        {(this.onlineWeight() / MAX_SUPPLY * 100.0).toFixed(2)}%
      </Fragment>
    );
  }

  officialRepresented() {
    return (
      <Fragment>{accounting.formatNumber(this.officialWeight())}</Fragment>
    );
  }

  officialPercent() {
    return (
      <Fragment>
        {(this.officialWeight() / MAX_SUPPLY * 100).toFixed(2)}%
      </Fragment>
    );
  }

  officialOnlinePercent() {
    return (
      <Fragment>
        {(this.officialWeight() / this.onlineWeight() * 100).toFixed(2)}%
      </Fragment>
    );
  }

  render() {
    const { representativesOnline } = this.state;
    console.log(this.rebroadcastableReps());

    return (
      <div className="p-4">
        <div className="row align-items-center">
          <div className="col-md">
            <h1>Network Status</h1>
          </div>
        </div>

        <hr />

        <div className="row mt-5">
          <div className="col">
            <h2 className="mb-0">
              {accounting.formatNumber(_.keys(representativesOnline).length)}{" "}
              <span className="text-muted">representatives online</span>
            </h2>
            <p className="text-muted">
              A representative must have at least 256 NANO delegated to them
            </p>
            <h2 className="mb-0">
              {accounting.formatNumber(
                _.keys(this.rebroadcastableReps()).length
              )}{" "}
              <span className="text-muted">
                representatives rebroadcasting votes
              </span>
            </h2>
            <p className="text-muted">
              A representative will only rebroadcast votes if it's delegated >
              0.1% of the total supply
            </p>
            <h5 className="mb-0">
              {this.amountRepresented()}{" "}
              <span className="text-muted">voting power is online</span>{" "}
            </h5>
            <p className="text-muted">
              {this.percentRepresented()}{" "}
              <span className="text-muted">of the total voting power</span>
            </p>
            <h5 className="mb-0">
              {this.officialRepresented()} NANO{" "}
              <span className="text-muted">
                is delegated to official representatives
              </span>
            </h5>
            <p className="text-muted">
              {this.officialPercent()}{" "}
              <span className="text-muted">of the total voting power and</span>{" "}
              {this.officialOnlinePercent()}{" "}
              <span className="text-muted">of the online voting power</span>
            </p>
          </div>
        </div>

        <div className="row mt-5">
          <div className="col-md">
            <h2>Block Stats</h2>
            {this.getBlocksByType()}
          </div>
          <div className="col-md mt-3 mt-md-0">
            <PeerVersions peers={this.state.peers} />
          </div>
        </div>

        <AggregateNetworkData />
      </div>
    );
  }

  getBlocksByType() {
    const { blocksByType } = this.state;

    return _.map(blocksByType, (count, type) => {
      return <BlockByTypeStats key={type} type={type} count={count} />;
    });
  }
}

export default injectClient(NetworkStatus);
