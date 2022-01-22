var anch = require('@project-serum/anchor');
const { SystemProgram } = anch.web3;

const main = async () => {
  console.log('Starting test');
  const provider = anch.Provider.env();
  anch.setProvider(provider);

  const program = anch.workspace.Myepicproject;
  const baseAccount = anch.web3.Keypair.generate();

  const tx = await program.rpc.startStuffOff({
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
      systemProgram: SystemProgram.programId,
    },
    signers: [baseAccount],
  });
  console.log('Your Transaction Signature: ', tx);

  let account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('GIF Count: ', account.totalGifs.toString())

  await program.rpc.addNewGif('https://media2.giphy.com/media/N5PsztQSjkYMw/giphy.gif', {
    accounts: {
      baseAccount: baseAccount.publicKey,
      user: provider.wallet.publicKey,
    }
  });

  account = await program.account.baseAccount.fetch(baseAccount.publicKey);
  console.log('GIF Count: ', account.totalGifs.toString());
  console.log('GIF List: ', account.gifList);
}

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

runMain();
