// These options should map to the tf backend configuration:
// https://www.terraform.io/docs/backends/types/http.html
const USERNAME = process.env.TF_BACKEND_USERNAME;
const PASSWORD = process.env.TF_BACKEND_PASSWORD;

const UPDATE_METHOD = 'POST';
const LOCK_ENDPOINT_SUFFIX = '';
const LOCK_METHOD = 'LOCK';
const UNLOCK_ENDPOINT_SUFFIX = '';
const UNLOCK_METHOD = 'UNLOCK';

// /TF Backend options

const STATE_KEY_PREFIX = 'state::';
const LOCK_KEY_PREFIX = 'lock::';

// Refuse to launch if not configured properly
if (!USERNAME || !PASSWORD) {
  throw new Error(
    "Please set a username and a password in the repl's .env file. Check the readme for more info",
  );
}

function btoa(string) {
  return Buffer.from(string).toString('base64');
}

class Response {
  constructor(body = '', options = {}) {
    this.body = body;
    this.headers = options.headers || {};
    this.status = options.status || 200;
  }
}

const Client = require('@replit/database');
const client = new Client();

const http = require('http');
const url = require('url');
const server = http.createServer(async (req, res) => {
  console.log(`< ${req.method} ${req.url}`)
  let response;
  try {
    req.text = () =>
      new Promise((resolve, reject) => {
        let body = [];
        req
          .on('data', chunk => {
            body.push(chunk);
          })
          .on('end', () => {
            resolve(Buffer.concat(body).toString());
          })
          .on('error', reject);
      });

    req.headers.get = header => req.headers[header.toLowerCase()];

    response = await handleRequest(req);
  } catch (error) {
    response = new Response(error.stack, { status: 500 });
  }

  res.writeHead(response.status, response.headers).end(response.body);
  console.log(`> ${req.method} ${req.url} ${response.status}`)
});
server.listen(8080, '0.0.0.0');

console.log("Terraform backend is now running!")

async function handleRequest(req) {
  try {
    {
      // Check authorisation
      let authError = await authenticate(req);
      if (authError) return authError;
    }

    let requestURL = url.parse(req.url);
    const path = requestURL.pathname;
    switch (true) {
      case req.method === 'GET':
        return await getState(path);
      case req.method === UPDATE_METHOD:
        return await setState(path, await req.text());
      case req.method === 'DELETE':
        return await deleteState(path);
      case req.method === LOCK_METHOD && path.endsWith(LOCK_ENDPOINT_SUFFIX):
        return await lockState(
          path.substr(0, path.length - LOCK_ENDPOINT_SUFFIX.length),
          await req.text(),
        );
      case req.method === UNLOCK_METHOD &&
        path.endsWith(UNLOCK_ENDPOINT_SUFFIX):
        return await unlockState(
          path.substr(0, path.length - UNLOCK_ENDPOINT_SUFFIX.length),
          await req.text(),
        );
    }

    return new Response('Nothing found at ' + requestURL.pathname, {
      status: 404,
    });
  } catch (error) {
    return new Response(error.stack, { status: 500 });
  }
}

const expectedToken = btoa([USERNAME, PASSWORD].join(':'));
async function authenticate(req) {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || typeof authHeader !== 'string') {
    return new Response('Missing credentials', {
      status: 401,
      headers: {
        'WWW-Authenticate': 'Basic realm="Terraform State"',
      },
    });
  }

  const [scheme, credentials, ...rest] = authHeader.split(' ');
  if (rest.length != 0 || scheme !== 'Basic' || credentials !== expectedToken) {
    return new Response('Invalid credentials', {
      status: 403,
      headers: {
        'WWW-Authenticate': 'Basic realm="Terraform State"',
      },
    });
  }

  return void 0;
}

async function getState(path) {
  const state = await client.get(STATE_KEY_PREFIX + path);
  if (!state) {
    return new Response('', {
      status: 404,
      headers: {
        'Cache-Control': 'no-store',
      },
    });
  }

  return new Response(state || '', {
    headers: {
      'Content-type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
async function setState(path, body) {
  await client.set(STATE_KEY_PREFIX + path, body);
  return new Response(body || '', {
    status: 200,
    headers: {
      'Content-type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}
async function deleteState(path) {
  await client.delete(STATE_KEY_PREFIX + path);
  return new Response('', {
    status: 200,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

async function lockState(path, body) {
  const existingLock = await client.get(LOCK_KEY_PREFIX + path);
  if (existingLock) {
    return new Response(existingLock, {
      status: 423,
      headers: {
        'Content-type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  }
  await client.set(LOCK_KEY_PREFIX + path, body);
  return new Response(body, {
    headers: {
      'Content-type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });
}

async function unlockState(path, body) {
  await client.delete(LOCK_KEY_PREFIX + path);
  return new Response('', {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
