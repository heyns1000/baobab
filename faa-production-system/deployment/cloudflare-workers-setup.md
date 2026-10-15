# FAA Ecosystem - Cloudflare Workers Setup

## Why Cloudflare Workers?

For the **Baobab Orchestrator** and **high-frequency pulse system** (9-second intervals), Cloudflare Workers provides:

- **Global edge network** (200+ cities)
- **Low latency** (<50ms)
- **High scalability** (millions of requests)
- **Durable Objects** (stateful coordination)
- **KV storage** (for ledger/configuration)

---

## Architecture

```
Vercel (Seedwave Admin)
     ↓
Cloudflare Workers (Orchestrator)
     ↓
     ├─→ 7,038 Nodes (distributed)
     ├─→ 120 Lions (monitoring)
     └─→ Giraffe Vision (33km scanning)
```

---

## Step 1: Install Wrangler CLI

```bash
npm install -g wrangler

# Login
wrangler login
```

---

## Step 2: Create `wrangler.toml`

```toml
name = "faa-orchestrator"
main = "src/index.js"
compatibility_date = "2025-01-01"
account_id = "your_cloudflare_account_id"

# KV Namespaces
[[kv_namespaces]]
binding = "FAA_LEDGER"
id = "your_kv_namespace_id"

[[kv_namespaces]]
binding = "FAA_CONFIG"
id = "your_config_kv_id"

# Durable Objects
[[durable_objects.bindings]]
name = "BAOBAB_TRUNK"
class_name = "BaobabTrunk"
script_name = "faa-orchestrator"

[[migrations]]
tag = "v1"
new_classes = ["BaobabTrunk"]

# Environment variables
[vars]
FAA_VERSION = "vs111.111"
TRUNK_LOCKED = "true"
NODE_COUNT = "7038"
PULSE_INTERVAL = "9"
LIONS = "120"
GIRAFFE_VISION_KM = "33"

# Cron trigger for pulse system
[triggers]
crons = ["*/9 * * * * *"]  # Every 9 seconds
```

---

## Step 3: Create Worker Script

Create `src/index.js`:

```javascript
/**
 * FAA Cloudflare Worker - Baobab Orchestrator
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Route handling
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        version: env.FAA_VERSION,
        trunk_locked: env.TRUNK_LOCKED === 'true',
        nodes: parseInt(env.NODE_COUNT),
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (url.pathname === '/pulse') {
      return await handlePulse(env);
    }

    if (url.pathname === '/nodes/status') {
      return await getNodeStatus(env);
    }

    return new Response('FAA Orchestrator Active', { status: 200 });
  },

  // Scheduled pulse every 9 seconds
  async scheduled(event, env, ctx) {
    await executePulse(env);
  }
};

async function handlePulse(env) {
  const result = await executePulse(env);
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function executePulse(env) {
  const timestamp = new Date().toISOString();
  const nodeCount = parseInt(env.NODE_COUNT);

  // Record pulse in ledger
  await env.FAA_LEDGER.put(`pulse:${timestamp}`, JSON.stringify({
    timestamp,
    node_count: nodeCount,
    lions: parseInt(env.LIONS),
    giraffe_km: parseInt(env.GIRAFFE_VISION_KM)
  }));

  return {
    pulsed: true,
    timestamp,
    nodes: nodeCount
  };
}

async function getNodeStatus(env) {
  // Get last pulse from KV
  const pulseKey = await env.FAA_LEDGER.list({ prefix: 'pulse:' });
  const lastPulse = pulseKey.keys[pulseKey.keys.length - 1];

  return new Response(JSON.stringify({
    total_nodes: parseInt(env.NODE_COUNT),
    lions: parseInt(env.LIONS),
    giraffe_vision_km: parseInt(env.GIRAFFE_VISION_KM),
    last_pulse: lastPulse?.name || 'No pulse yet',
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Durable Object for Baobab Trunk state
export class BaobabTrunk {
  constructor(state, env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === '/state') {
      const state = await this.state.storage.get('trunk_state') || {
        version: 'vs111.111',
        locked: true,
        initialized: new Date().toISOString()
      };

      return new Response(JSON.stringify(state), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Trunk active', { status: 200 });
  }
}
```

---

## Step 4: Create KV Namespaces

```bash
# Create ledger KV
wrangler kv:namespace create "FAA_LEDGER"

# Create config KV
wrangler kv:namespace create "FAA_CONFIG"

# Note the IDs and update wrangler.toml
```

---

## Step 5: Upload Configuration

```bash
# Upload master config to KV
wrangler kv:key put --binding=FAA_CONFIG "master_config" \
  "$(cat ../config/faa-master-config.json)"
```

---

## Step 6: Deploy

```bash
# Deploy to Cloudflare
wrangler deploy

# You'll get a URL like:
# https://faa-orchestrator.your-account.workers.dev
```

---

## Step 7: Configure Custom Domain

```bash
# Add custom domain
wrangler deploy --route orchestrator.faa.zone

# Or in Cloudflare Dashboard:
# Workers → faa-orchestrator → Triggers → Add Custom Domain
# Domain: orchestrator.faa.zone
```

---

## Step 8: Test Deployment

```bash
# Test health
curl https://orchestrator.faa.zone/health

# Test pulse
curl https://orchestrator.faa.zone/pulse

# Test node status
curl https://orchestrator.faa.zone/nodes/status
```

---

## Monitoring

### View Logs

```bash
# Tail logs in real-time
wrangler tail
```

### Analytics

Check Cloudflare Dashboard → Workers → faa-orchestrator → Analytics

Monitor:
- Request count (should pulse every 9 seconds)
- CPU time
- Success rate
- P50/P99 latency

---

## Durable Objects Setup

Durable Objects provide stateful coordination for the Baobab trunk:

```javascript
// Access trunk state from any worker
const id = env.BAOBAB_TRUNK.idFromName('main-trunk');
const stub = env.BAOBAB_TRUNK.get(id);
const response = await stub.fetch('/state');
```

---

## Success Checklist

- [ ] Wrangler CLI installed
- [ ] `wrangler.toml` configured
- [ ] KV namespaces created
- [ ] Configuration uploaded
- [ ] Worker deployed
- [ ] Custom domain configured
- [ ] Health endpoint responding
- [ ] Pulse system active (every 9s)
- [ ] Logs showing activity
- [ ] Durable Object accessible

---

**Status: ORCHESTRATOR DEPLOYED** 🌳
