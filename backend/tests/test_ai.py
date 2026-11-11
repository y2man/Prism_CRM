def test_ai_chat_uses_history_and_mocked_provider(auth, monkeypatch):
    captured = {}
    def fake_generate(prompt, history=None):
        captured["history"] = history
        return "Mocked Groq answer"
    monkeypatch.setattr("app.api.routes.ai.generate_text", fake_generate)
    response = auth.post("/api/ai/chat", json={"message": "What next?", "history": [{"role": "user", "content": "Earlier question"}]})
    assert response.status_code == 200
    assert response.json() == {"reply": "Mocked Groq answer", "provider": "groq"}
    assert captured["history"] == [{"role": "user", "content": "Earlier question"}]

def test_ai_provider_failure_is_not_replaced_with_fallback(auth, monkeypatch):
    def fail(*args, **kwargs): raise RuntimeError("provider down")
    monkeypatch.setattr("app.api.routes.ai.generate_text", fail)
    response = auth.post("/api/ai/chat", json={"message": "pipeline"})
    assert response.status_code == 503
    assert response.json()["detail"] == "AI is unavailable right now. Please try again shortly."

def test_ai_customer_data_is_owner_scoped(auth, monkeypatch):
    auth.post("/api/customers", json={"name": "Only mine", "company": "Private"})
    captured = {}
    def fake_generate(prompt, history=None):
        captured["prompt"] = prompt
        return "done"
    monkeypatch.setattr("app.api.routes.ai.generate_text", fake_generate)
    response = auth.post("/api/ai/chat", json={"message": "summarize"})
    assert response.status_code == 200
    assert "Only mine" in captured["prompt"]
