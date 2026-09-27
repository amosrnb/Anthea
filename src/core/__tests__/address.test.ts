import { detectFamily, isValidBitcoinAddress, isValidEvmAddress, isValidSolanaAddress, parseBitcoinAddress, toChecksumAddress } from '../address';

describe('EVM (EIP-55)', () => {
  // Test cases from the EIP-55 specification.
  const eip55 = [
    '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    '0xfB6916095ca1df60bB79Ce92cE3Ea74c37c5d359',
    '0xdbF03B407c01E7cD3CBea99509d93f8DDDC8C6FB',
    '0xD1220A0cf47c7B9Be7A2E6BA89F429762e7b9aDb',
  ];

  it.each(eip55)('checksums %s', (a) => {
    expect(toChecksumAddress(a.toLowerCase())).toBe(a);
    expect(isValidEvmAddress(a)).toBe(true);
  });

  it('accepts all-lower and all-upper hex without checksum', () => {
    expect(isValidEvmAddress(eip55[0]!.toLowerCase())).toBe(true);
    expect(isValidEvmAddress('0x' + eip55[0]!.slice(2).toUpperCase())).toBe(true);
  });

  it('rejects a wrong mixed-case checksum and malformed input', () => {
    expect(isValidEvmAddress(eip55[0]!.replace('aAeb', 'AAeb'))).toBe(false);
    expect(isValidEvmAddress('0x123')).toBe(false);
    expect(isValidEvmAddress('5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe(false);
    expect(() => toChecksumAddress('0x12')).toThrow();
  });
});

describe('Bitcoin (BIP173 / BIP350)', () => {
  it.each([
    ['bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', 'mainnet', 0, 20],
    ['BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3T4', 'mainnet', 0, 20],
    ['tb1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3q0sl5k7', 'testnet', 0, 32],
    ['bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqzk5jj0', 'mainnet', 1, 32],
    ['tb1pqqqqp399et2xygdj5xreqhjjvcmzhxw4aywxecjdzew6hylgvsesf3hn0c', 'testnet', 1, 32],
  ] as const)('parses %s', (address, network, version, length) => {
    const parsed = parseBitcoinAddress(address)!;
    expect(parsed).toMatchObject({ network, version });
    expect(parsed.program).toHaveLength(length);
  });

  it.each([
    // BIP350 invalid vectors: wrong encoding for the version, bad lengths, mixed case, unknown prefix, bad checksum.
    'bc1p0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vqh2y7hd', // v1 with bech32
    'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kemeawh', // v0 with bech32m
    'bc1zw508d6qejxtdg4y5r3zarvaryvqyzf3du', // v2 20 bytes with bech32 (must be bech32m)
    'tb1q0xlxvlhemja6c4dqv22uapctqupfhlxm9h8z3k2e72q4k9hcz7vq24jc47', // v0 of 32 bytes but bech32m
    'bc1pw5dgrnzv', // program too short
    'BC1QW508D6QEJXTDG4Y5R3ZARVARY0C5XW7KV8F3t4', // mixed case
    'ltc1qw508d6qejxtdg4y5r3zarvary0c5xw7kgmn4n9', // other prefix
    'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t5', // bad checksum
    'bc1qr508d6qejxtdg4y5r3zarvaryvqyzf3du', // v0 16 bytes
    '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2', // legacy P2PKH (not supported in v1)
    'bc1gmk9yu', // empty data
  ])('rejects %s', (address) => {
    expect(parseBitcoinAddress(address)).toBeNull();
  });

  it('checks the expected network', () => {
    expect(isValidBitcoinAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', 'mainnet')).toBe(true);
    expect(isValidBitcoinAddress('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', 'testnet')).toBe(false);
  });
});

describe('Solana', () => {
  it('accepts base58 strings of exactly 32 bytes', () => {
    expect(isValidSolanaAddress('11111111111111111111111111111111')).toBe(true); // System Program
    expect(isValidSolanaAddress('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')).toBe(true);
  });

  it('rejects wrong lengths and characters', () => {
    expect(isValidSolanaAddress('1111111111111111111111111111111')).toBe(false); // 31 chars
    expect(isValidSolanaAddress('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5D0')).toBe(false); // '0' is not base58
    expect(isValidSolanaAddress('3yZe7d')).toBe(false);
    expect(isValidSolanaAddress('z'.repeat(44))).toBe(false); // decodes to more than 32 bytes
  });
});

describe('detectFamily', () => {
  it('recognizes each family', () => {
    expect(detectFamily('0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed')).toBe('evm');
    expect(detectFamily('bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toBe('btc');
    expect(detectFamily('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA')).toBe('sol');
    expect(detectFamily('hello')).toBeNull();
  });
});
