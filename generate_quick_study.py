import openai
import json

# Load your OpenAI API key
client = openai.OpenAI(api_key='OPEAI_API_KEY')  # ← Replace with your key 

# Load contract summary from file
with open('parsed_summary.json', 'r') as f:
    contract_summary = json.load(f)

# Build the prompt
prompt = f"""
You are an expert smart contract analyst.

Given the following structured contract summary, generate a **Quick Study** section written in clear bullet-point style, rich in both technical detail and real-world interpretation, similar to what an experienced human analyst would write.

The Quick Study must:
- Clearly state whether the contract uses a proxy pattern and whether it shares an implementation with other tokens.
- Identify the current implementation contract and its version (if available).
- Provide a **history of implementation versions** (V1, V1.1, V2, etc.) and describe key features or upgrades introduced at each stage.
- Summarize the **main purpose and functional role** of the contract — what is its core job (ex: stablecoin, yield token, governance, compliance tool).
- List and describe major functions (ex: issueTokens, burn, seize, transfer, transferFrom) and explain what they enable in practical terms.
- Detail the access control structure, including roles (ex: Owner, Master, Transfer Agent, Issuer, Asset Protector) and the powers each role holds.
- Explicitly state whether **peer-to-peer transfers** are allowed or restricted.
- Highlight special mechanisms (ex: omnibus burn, omnibus seize, gasless approvals, daily yield issuance, price peg maintenance, oracle price feeds, redemption systems).
- Include real-world implications and inferred behaviors (such as compliance features, regulatory controls, stablecoin pegs, yield distribution) even if not directly visible in the code, based on naming patterns and domain knowledge.
- Stick to bullet points but maintain a **human, expert tone** — avoid generic, robotic, or oversimplified summaries.

---

### Example 1:
Quick study
- The DSToken contract follows a proxy deployment pattern, inheriting from ProxyTarget and Initializable.
- The current implementation contract is StandardToken.
- Main purpose: a security token platform enabling controlled issuance, burning, and transfer of tokens with compliance features.
- History of implementation:
  - V1 (DSTokenV1.sol): Initial version with basic token functionality.
- Key functions include issueTokens, burn, seize, transfer, and transferFrom.
- Access control is managed through roles like Master, Transfer Agent, and Issuer, each with specific permissions.
- Peer-to-peer transfers are allowed via the standard transfer function.
- Special mechanisms include omnibus burning and seizing, and issuing tokens with multiple lock conditions.
- Real-world implications: enables asset freezing, forced transfers, and compliance-controlled token flows.

---

### Example 2:
Quick study
- A proxy deployment with upgradeability features.
- Current implementation is V1.
- Main purpose: managing an ERC-20-based token with strong regulatory controls and authorized roles.
- History of implementation:
  - V1 (DSTokenV1.sol): Initial version supporting controlled issuance and compliance mechanisms.
- Access control features:
  - Seizure: allows forced transfer from one account to another, controlled by the transfer agent or master.
- Transfer behavior:
  - Peer-to-peer transfers are explicitly allowed.
- Special mechanisms:
  - Omnibus burn and omnibus seize functions for batch operations.
- Inferred details:
  - Supports regulated issuance, burning, and transfers for financial compliance purposes.

---

### Example 3:
Quick study
- Various roles are defined in the BUIDL token: Transfer Agent, Exchange, Issuer, Master.
- Main purpose: a regulated investment token pegged to USD, providing daily yield distributions.
- Whitelist-like access control governs transfers.
- Seizure (forced transfer from an account to a specific account) is implemented, performed by the transfer agent or master.
- On-chain redemption to USDC is supported.
- Price is maintained at USD 1, with dividends distributed in BUIDL tokens.
- Yield is distributed daily to holders via the bulkIssuance() function.
- Peer-to-peer transfers are allowed but subject to role-based permissions.

---

Here is the extracted contract summary:
{json.dumps(contract_summary, indent=2)}

Please generate only the Quick Study section, following the style and richness shown in the examples. Do not include extra disclaimers or headings.
"""

# Call the OpenAI API
response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "user", "content": prompt}
    ],
    temperature=0.2
)

# Print the generated Quick Study
output = response.choices[0].message.content
print("\nGenerated Quick Study:\n")
print(output)
