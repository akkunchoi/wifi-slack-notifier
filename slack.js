'use strict';

const config = require('./private.json');

const _ = require('lodash');
const axios = require('axios');
const moment = require('moment');

const spots = config.spots; 

class Slack {
  constructor(options) {
    this.token = options.token;
    this.postMessageUrl = 'https://slack.com/api/chat.postMessage';
    this.updateStatusUrl = 'https://slack.com/api/users.profile.set';
  }

  post(params) {

    const payload = _.assign({}, {token: this.token}, params);

    return axios({
      method: 'get',
      url: this.postMessageUrl,
      params: payload
    });

  }

  updateStatus(params) {

    const payload = _.assign({}, {token: this.token}, params);

    return axios({
      method: 'get',
      url: this.updateStatusUrl,
      params: payload
    });

  }
}

const Sequelize = require('sequelize');
class Book {
  constructor(options) {
    this.sequelize = new Sequelize('slack', '', '', options);
    this.Log = this.sequelize.define('Log', {
      code: {
        type: Sequelize.STRING
      }
    });
    this.ready = this.sequelize.sync({});
  }
  getRecentlyRecord(id) {
    return this.ready.then(() => {
      return this.getRecord(id).then((log) => {
        if (!log) return null;
        if (moment().subtract(12, 'hours').isBefore(log.updatedAt)) {
          return log;
        }
      });
    });
  }
  getRecord(id) {
    return this.ready.then(() => {
      return this.Log.findOne({where: {code: id}});
    });
  }
  record(id) {
    return this.ready.then(() => {
      return this.getRecord(id).then((log) => {
        if (log) {
          log.changed('updatedAt', true);
          return log.save();
        } else {
          return this.Log.create({code: id});
        }
      });
    });
  }
}


const slack = new Slack({token: config.token});
const book= new Book({dialect: 'sqlite', storage: __dirname + '/slack.db'});

const exec = require('child_process').exec;

function getSSID() {
  return new Promise((resolve, reject) => {
    exec('networksetup -getairportnetwork en0', (err, stdout, stderr) => {
      if (err) return reject(stderr);
      var wifi = stdout.match(/Current Wi-Fi Network: (.+)/);
      if (wifi.length > 0) {
        resolve(wifi[1]);
      }
      reject();
    });
  });
}

getSSID().then((ssid) => {

  let spot = _.find(spots, (spot) => {
    if (typeof spot.ssid  === 'string') {
      return ssid.indexOf(spot.ssid) >= 0;
    }
  });
  
  if (!spot) return Promise.reject();

  return book.getRecentlyRecord(spot.id).then((record) => {

    if (record) return;

    return Promise.resolve()
      .then(() => {
        if (spot.profile) {
          return slack.updateStatus({
           profile: spot.profile
          }).then((res) => {
            console.log(res);
          });
        }
      })
      .then(() => {

        if (spot.text) {

          if (record) return;

          slack.post({
            channel: spot.channel,
            text: spot.text,
            as_user:'true'
          }).then((res) => {
            console.log(res);
          });

        }

      })
      .then(() => {
        return book.record(spot.id)
      });

  });

})
.catch((err) => {
  console.error(err.stack || err);
});

