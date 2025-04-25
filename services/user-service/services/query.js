export async function queryGet(query, params) {

    const res = await fetch('http://db:2999/read/get', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: query,
            params: Array.isArray(params) ? params : [params]
        })
    })

    const data = await res.json();

    return data;
}

export async function queryAll(query, params) {
    const res = await fetch('http://db:2999/read/all', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: query,
            params: Array.isArray(params) ? params : [params]
        })
    })

    const data = await res.json();

    return data;
}

export async function queryPost(query, params) {
    
    await fetch('http://db:2999/write/', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            query: query,
            params: Array.isArray(params) ? params : [params]
        })
    })
}

export async function beginTransaction() {
    await fetch('http://db:2999/transaction/begin', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
}

export async function commitTransaction() {
    await fetch('http://db:2999/transaction/commit', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
}

export async function rollbackTransaction() {
    await fetch('http://db:2999/transaction/rollback', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        }
    })
}