const fs = require('fs');
const parser = require('solidity-parser-antlr');

// Load Solidity file
const filePath = process.argv[2];
const content = fs.readFileSync(filePath, 'utf8');

try {
    const ast = parser.parse(content);

    const summary = {
        contracts: [],
    };

    parser.visit(ast, {
        ContractDefinition(node) {
            const contract = {
                name: node.name,
                inheritance: node.baseContracts.map(b => b.baseName.namePath),
                functions: [],
                modifiers: [],
                functionModifiers: {},
                roleIndicators: new Set(),
                upgradeability: {
                    usesDelegateCall: false,
                    hasInitializeFunction: false,
                    usesStorageGap: false,
                    inheritsUpgradeable: false
                }
            };

            node.subNodes.forEach(sub => {
                if (sub.type === 'FunctionDefinition') {
                    contract.functions.push(sub.name);

                    if (sub.modifiers) {
                        contract.functionModifiers[sub.name] = sub.modifiers.map(m => m.name);
                        sub.modifiers.forEach(m => {
                            if (m.name.startsWith('only')) {
                                contract.roleIndicators.add(m.name);
                            }
                        });
                    }

                    const lowerName = sub.name.toLowerCase();
                    if (['mint', 'burn', 'seize', 'pause', 'blacklist', 'whitelist'].some(keyword => lowerName.includes(keyword))) {
                        contract.roleIndicators.add(lowerName);
                    }

                    if (sub.name.toLowerCase().includes('initialize')) {
                        contract.upgradeability.hasInitializeFunction = true;
                    }
                }

                if (sub.type === 'ModifierDefinition') {
                    contract.modifiers.push(sub.name);
                    if (sub.name.startsWith('only')) {
                        contract.roleIndicators.add(sub.name);
                    }
                }

                if (sub.type === 'StateVariableDeclaration') {
                    sub.variables.forEach(variable => {
                        if (variable.name.includes('__gap') && variable.typeName.type === 'ArrayTypeName') {
                            contract.upgradeability.usesStorageGap = true;
                        }
                    });
                }
            });

            const upgradeableBases = ['Initializable', 'UUPSUpgradeable', 'ERC1967UpgradeUpgradeable'];
            if (contract.inheritance.some(base => upgradeableBases.includes(base))) {
                contract.upgradeability.inheritsUpgradeable = true;
            }

            contract.roleIndicators = Array.from(contract.roleIndicators);

            summary.contracts.push(contract);
        }
    });

    fs.writeFileSync('parsed_summary.json', JSON.stringify(summary, null, 2));
    console.log('Summary written to parsed_summary.json');
} catch (e) {
    console.error('Parsing error:', e);
}
