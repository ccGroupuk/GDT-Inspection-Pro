async function testAI() {
  // This line pulls your secret from the vault automatically
  const token = process.env.GITHUB_TOKEN; 

  const response = await fetch("https://models.inference.ai.azure.com/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: "Is the TradeVaultAi connection working?" }],
      model: "gpt-4o", 
      max_tokens: 50
    })
  });

  const data = await response.json();

  if (data.choices) {
    console.log("✅ SUCCESS! AI says:", data.choices[0].message.content);
  } else {
    console.log("❌ Error:", data);
  }
}

testAI();