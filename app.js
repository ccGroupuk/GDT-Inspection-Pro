async function runTradeVault() {
  const token = process.env.GITHUB_TOKEN;

  // --- YOUR SIMPLE PROMPT AREA ---
  const myInstruction = "You are the TradeVaultAI assistant. Summarize these trades and tell me if they look profitable.";
  const myTradeData = "Bought 10 BTC at $40k, Sold 10 BTC at $45k.";
  // -------------------------------

  try {
    const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
      method: "POST",
      headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: myInstruction },
          { role: "user", content: myTradeData }
        ],
        model: "gpt-4o"
      })
    });

    const data = await response.json();
    console.log("📊 TRADEVAULT ANALYSIS:");
    console.log(data.choices[0].message.content);
  } catch (err) {
    console.log("Something went wrong. Check your GITHUB_TOKEN!");
  }
}

runTradeVault();