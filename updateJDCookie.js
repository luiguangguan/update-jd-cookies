// cron "0 */2 * * *" script-path=updateJDCookie.js, tag=更新京东Cookie, enabled=true
// script-name=更新京东Cookie
/*
update：2024/05/08
*/
const got = require('got');
require('dotenv').config();
const { readFile } = require('fs/promises');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const qlDir = '/ql';
const authFile = path.join(qlDir, '/data/config/auth.json');

const api = got.extend({
  prefixUrl: 'http://localhost:5600',
  retry: { limit: 0 },
});

async function getToken() {
  const authConfig = JSON.parse(await fs.readFileSync(authFile, 'utf8').trim());
  return authConfig.token;
}

module.exports.getEnvs = async () => {
  const token = await getToken();
  const body = await api({
    url: 'api/envs',
    searchParams: {
      // searchValue: 'JD_COOKIE',
      searchValue: '',
      t: Date.now(),
    },
    headers: {
      Accept: 'application/json',
      authorization: `Bearer ${token}`,
    },
  }).json();
  return body.data;
};

module.exports.getEnvsValueByName = async (name) => {
  const envs = await this.getEnvs();
  for (let i = 0; i < envs.length; i++) {
    if (envs[i].name == name) {
      return envs[i].value;
    }
  }
  return "";
};

module.exports.getEnvsCount = async () => {
  const data = await this.getEnvs();
  return data.length;
};

module.exports.addEnv = async (cookie, remarks) => {
  const token = await getToken();
  const body = await api({
    method: 'post',
    url: 'api/envs',
    params: { t: Date.now() },
    json: [{
      name: 'JD_COOKIE',
      value: cookie,
      remarks,
    }],
    headers: {
      Accept: 'application/json',
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;charset=UTF-8',
    },
  }).json();
  return body;
};

module.exports.updateEnv = async (name, cookie, eid, remarks) => {
  const token = await getToken();
  const body = await api({
    method: 'put',
    url: 'api/envs',
    params: { t: Date.now() },
    json: {
      name: name,
      value: cookie,
      id: eid,
      remarks,
    },
    headers: {
      Accept: 'application/json',
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;charset=UTF-8',
    },
  }).json();
  return body;
};

module.exports.DisableCk = async (eid) => {
  const token = await getToken();
  const body = await api({
    method: 'put',
    url: 'api/envs/disable',
    params: { t: Date.now() },
    body: JSON.stringify([eid]),
    headers: {
      Accept: 'application/json',
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;charset=UTF-8',
    },
  }).json();
  return body;
};

module.exports.EnableCk = async (eid) => {
  const token = await getToken();
  const body = await api({
    method: 'put',
    url: 'api/envs/enable',
    params: { t: Date.now() },
    body: JSON.stringify([eid]),
    headers: {
      Accept: 'application/json',
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;charset=UTF-8',
    },
  }).json();
  return body;
};

module.exports.getstatus = async (eid) => {
  const envs = await this.getEnvs();
  // console.log(envs);
  for (let i = 0; i < envs.length; i++) {
    if (envs[i].id == eid) {
      return envs[i].status;
    }
  }
  return 99;
};

module.exports.getstatusByName = async (name) => {
  const envs = await this.getEnvs();
  // console.log(envs);
  for (let i = 0; i < envs.length; i++) {
    if (envs[i].name == name) {
      return envs[i].status;
    }
  }
  return 99;
};

module.exports.getEvnIdByName = async (name) => {
  const envs = await this.getEnvs();
  //  console.log(envs);
  for (let i = 0; i < envs.length; i++) {
    if (envs[i].name == name) {
      return envs[i].id;
    }
  }
  return "";
};


module.exports.getEnvById = async (eid) => {
  const envs = await this.getEnvs();
  for (let i = 0; i < envs.length; i++) {
    if (envs[i].id == eid) {
      return envs[i].value;
    }
  }
  return "";
};

module.exports.delEnv = async (eid) => {
  const token = await getToken();
  const body = await api({
    method: 'delete',
    url: 'api/envs',
    params: { t: Date.now() },
    body: JSON.stringify([eid]),
    headers: {
      Accept: 'application/json',
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;charset=UTF-8',
    },
  }).json();
  return body;
};

module.exports.addEnv = async (name, cookie, remarks) => {
  const token = await getToken();
  const body = await api({
    method: 'post',
    url: 'api/envs',
    params: { t: Date.now() },
    json: [{
      name: name,
      value: cookie,
      remarks,
    }],
    headers: {
      Accept: 'application/json',
      authorization: `Bearer ${token}`,
      'Content-Type': 'application/json;charset=UTF-8',
    },
  }).json();
  return body;
};

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getCookie(kv){
  const keyValuePairs = kv.split(';');

  // 创建一个对象，用于存储键值对
  const envVariables = {};

  // 遍历键值对数组，将每一对分割成键和值，并存储到对象中
  keyValuePairs.forEach(pair => {
      // 过滤掉空字符串的情况
    if (pair.trim()) {
      const [key, value] = pair.trim().split('=');
      envVariables[key] = value;
    }
  });
  return envVariables;
}

module.exports.Go = async () => {
  var env_name = "JD_COOKIE";
  var cookie_url = await this.getEnvsValueByName("jdsign_url");
  if(!/http(|s):\/\/.?/.test(cookie_url)){
    console.log("请在环境变量cookie_url设置正确的cookie更新地址，https://example.com/cookie.txt");
    console.log("本次更新取消");
    return;
  }
  var evnStatus = await this.getstatusByName(env_name);

  if (/*evnStatus != 0*/ true) {
    console.log("开始更新");
    axios.get(cookie_url)
      .then(async response => {

        // 获取新的内容
        var newCookie = response.data.trim();
        var newCookieKV = getCookie(newCookie);
        console.log("cookie键值对");
        console.log(newCookieKV);
        if(!newCookieKV||!newCookieKV.pt_key){
          console.log("没有找到cookie，本次更新取消");
          return;
        }else{
          console.log(newCookieKV.pt_key);
          newCookie = newCookieKV.pt_key;
        }
        console.log('成功获取 JD_COOKIE:', newCookie);
        if(!newCookie||newCookie.trim()==""){
          console.log("更新的内容为空，本次更新取消");
          return;
        }
        // 将新的内容写入环境变量JD_COOKIE
        if (evnStatus == "99") {
          //添加环境变量

          var radd = await this.addEnv(env_name, newCookie, "");

        } else if (evnStatus == 1) {
          //更新和启用环境变量    
          let eid = await this.getEvnIdByName(env_name);

          // 检查环境变量是否存在
          var ptKeyEnv = await this.getEnvsValueByName(env_name);

          if (ptKeyEnv) {
            var envVariables = getCookie(ptKeyEnv);
            if(newCookie == envVariables.pt_key)
            {
              console.log("可能cookie【"+env_name+"】已经失效，请及时更新cookie到【"+cookie_url+"】");
              console.log("本次更新取消");
              return;
            }
            // 更新 pt_key 的值
            envVariables.pt_key = newCookie;
            console.log("更新对象");
            console.log(envVariables);
            // 将对象中的键值对拼接成新的环境变量字符串
            var newPtKeyEnv = Object.entries(envVariables).map(([key, value]) => `${key}=${value}`).join(';');
            if(newPtKeyEnv[newPtKeyEnv.length-1]!=";"){
              newPtKeyEnv +=";";
            }
            // 更新环境变量
            this.updateEnv(env_name, newPtKeyEnv, eid, "");
          } else {
            console.error('环境变量 pt_key 不存在');
          }
        }

        var eid = await this.getEvnIdByName(env_name);

        await this.EnableCk(eid);

        // 输出成功消息
        console.log('成功获取并更新 JD_COOKIE:', newCookie);
      })
      .catch(error => {
        console.error('获取 cookie 失败:', error.message);
        JSON.stringify(error);
      });
  }else{
    console.log("没有更新的需要");
  }
};

this.Go();
