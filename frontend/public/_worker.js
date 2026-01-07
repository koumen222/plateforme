export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const asset = await env.ASSETS.fetch(request)
    if (asset.status === 404) {
      return env.ASSETS.fetch(new Request(new URL("/index.html", url)))
    }
    return asset
  }
}

