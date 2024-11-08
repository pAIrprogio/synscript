async function main() {
  console.log("Hello World");
}

await main().then(() => {
  console.log("Done");
  // Force IPC to close
  process.exit(0);
});
