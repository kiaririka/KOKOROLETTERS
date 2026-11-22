const fs = require('fs');
let file = fs.readFileSync('src/App.tsx', 'utf8');

file = file.replace(
  /<JapanMap\n                    unlockedRegions=\{session\?\.unlocked_regions \|\| \[\]\}/g,
  '<JapanMap\n                    isSubscriber={session?.subscriber?.subscription_status === "Active"}\n                    unlockedRegions={session?.unlocked_regions || []}'
);

fs.writeFileSync('src/App.tsx', file);
console.log("Updated App.tsx successfully.");
