def test_routes_require_login(client):
    assert client.get("/api/customers").status_code == 401
    assert client.get("/api/tasks").status_code == 401
    assert client.get("/api/stats").status_code == 401
    assert client.post("/api/ai/chat", json={"message": "hello"}).status_code == 401

def test_account_login_and_owner_isolation(client):
    first = client.post("/api/auth/register", json={"name": "Owner One", "email": "one@example.com", "password": "secure-passphrase-1"})
    assert first.status_code == 201
    token1 = first.json()["access_token"]
    a = client.post("/api/customers", headers={"Authorization": f"Bearer {token1}"}, json={"name": "Ada", "company": "North", "email": "ada@example.com", "value": 1000})
    assert a.status_code == 201
    second = client.post("/api/auth/register", json={"name": "Owner Two", "email": "two@example.com", "password": "secure-passphrase-2"})
    token2 = second.json()["access_token"]
    assert client.get("/api/customers", headers={"Authorization": f"Bearer {token2}"}).json() == []
    assert client.delete(f"/api/customers/{a.json()['id']}", headers={"Authorization": f"Bearer {token2}"}).status_code == 404
    login = client.post("/api/auth/login", json={"email": "one@example.com", "password": "secure-passphrase-1"})
    assert login.status_code == 200
    assert login.json()["user"]["name"] == "Owner One"

def test_search_sort_and_pagination(auth):
    for name in ("Ada", "Zoe", "Mina"):
        auth.post("/api/customers", json={"name": name, "company": "Acme"})
    assert [c["name"] for c in auth.get("/api/customers?q=Acme&sort=name").json()] == ["Ada", "Mina", "Zoe"]
    assert len(auth.get("/api/customers?page=2&per_page=2").json()) == 1
    assert auth.get("/api/customers/count?q=Acme").json()["total"] == 3

def test_stage_rules_and_task_ownership(auth):
    c = auth.post("/api/customers", json={"name": "Ada", "company": "North", "stage": "lead"}).json()
    assert auth.post(f"/api/customers/{c['id']}/advance").json()["stage"] == "contacted"
    assert auth.patch(f"/api/customers/{c['id']}", json={"stage": "lost"}).json()["stage"] == "lost"
    assert auth.post(f"/api/customers/{c['id']}/advance").status_code == 409
    assert auth.patch(f"/api/customers/{c['id']}", json={"stage": "not-a-stage"}).status_code == 422
    assert auth.post("/api/customers", json={"name": "A", "company": "B", "email": "not-an-email"}).status_code == 422
