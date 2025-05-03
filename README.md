Clone the repo:
git clone https://github.com/Javier1845/Project1.git
cd Project1

Install Node.js dependencies:
npm install

(Optional) Set up Python virtual environment:
python -m venv .venv
.\.venv\Scripts\activate

Install Python dependencies:
pip install -r requirements.txt

Set your OpenAI API key inside generate_quick_study.py

Download a Solidity contract file from Etherscan (copy/paste the verified source code)

Save the contract file (ex. MyContract.sol) into the Project1 folder

Run the parser:
node parser.js MyContract.sol

Run the generator:
python generate_quick_study.py
