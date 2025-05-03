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
                stateRoles: new Set(),
                specialMechanisms: new Set(),
                upgradeability: {
                    usesDelegateCall: false,
                    hasInitializeFunction: false,
                    usesStorageGap: false,
                    inheritsUpgradeable: false
                }
            };

            const complianceKeywords = ['freeze', 'unfreeze', 'wipe', 'pause', 'blacklist', 'lock'];

            node.subNodes.forEach(sub => {
                if (sub.type === 'FunctionDefinition') {
                    contract.functions.push(sub.name);

                    // Capture modifiers attached to functions
                    if (sub.modifiers) {
                        contract.functionModifiers[sub.name] = sub.modifiers.map(m => m.name);
                        sub.modifiers.forEach(m => {
                            if (m.name.startsWith('only')) {
                                contract.roleIndicators.add(m.name);
                            }
                        });
                    }

                    // Check for compliance-related function names
                    const lowerName = sub.name.toLowerCase();
                    complianceKeywords.forEach(keyword => {
                        if (lowerName.includes(keyword)) {
                            contract.specialMechanisms.add(keyword);
                        }
                    });

                    if (lowerName.includes('initialize')) {
                        contract.upgradeability.hasInitializeFunction = true;
                    }

                    // Scan function body for delegatecall
                    if (sub.body && sub.body.statements) {
                        sub.body.statements.forEach(statement => {
                            if (statement.type === 'ExpressionStatement' &&
                                statement.expression.type === 'FunctionCall') {

                                const expr = statement.expression.expression;

                                if ((expr.memberName && expr.memberName.includes('delegatecall')) ||
                                    (expr.name && expr.name.includes('delegatecall'))) {
                                    contract.upgradeability.usesDelegateCall = true;
                                }
                            }
                        });
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
                        const varName = variable.name.toLowerCase();
                        if (varName.includes('owner')) contract.stateRoles.add('Owner');
                        if (varName.includes('pauser')) contract.stateRoles.add('Pauser');
                        if (varName.includes('assetprotector') || varName.includes('asset_protector')) contract.stateRoles.add('Asset Protector');

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

            const inheritedRoles = ['Ownable', 'Pausable', 'AccessControl'];
            inheritedRoles.forEach(roleContract => {
                if (contract.inheritance.includes(roleContract)) {
                    contract.stateRoles.add(roleContract);
                }
            });

            contract.roleIndicators = Array.from(contract.roleIndicators);
            contract.stateRoles = Array.from(contract.stateRoles);
            contract.specialMechanisms = Array.from(contract.specialMechanisms);

            summary.contracts.push(contract);
        }
    });

    fs.writeFileSync('parsed_summary.json', JSON.stringify(summary, null, 2));
    console.log('Summary written to parsed_summary.json');
} catch (e) {
    console.error('Parsing error:', e);
}
