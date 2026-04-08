import fs from 'fs';

const data = [{"collectorName":"Arianne Sanchez","collection":{"daily":{"collected":"$0.00","target":"$1,500.00","variance":"0.00%"},"weekly":{"collected":"$2,810.00","target":"$10,000.00","variance":"28.10%"},"monthly":{"collected":"$2,810.00","target":"$30,000.00","variance":"9.37%"},"payments":{"count":"6","average":"$468.33"}},"performance":{"overview":{"assigned":"117","inactivated":"0"},"daily":{"worked":"46","outbound":"207","inbound":"10","missed":"3","duration":"0:00:00"},"weekly":{"worked":"225","outbound":"590","inbound":"46","missed":"14","duration":"0:00:00"},"monthly":{"worked":"225","outbound":"590","inbound":"46","missed":"14","duration":"0:09:03"}}},{"collectorName":"Unassigned","collection":{"daily":{"collected":"$0.00","target":"$0.00","variance":"0.00%"},"weekly":{"collected":"$3,503.39","target":"$0.00","variance":"0.00%"},"monthly":{"collected":"$3,503.39","target":"$0.00","variance":"0.00%"},"payments":{"count":"2","average":"$1,751.70"}},"performance":{"overview":{"assigned":"55552","inactivated":"0"},"daily":{"worked":"0","outbound":"0","inbound":"0","missed":"0","duration":"0:55:19"},"weekly":{"worked":"0","outbound":"","inbound":"","missed":"","duration":""},"monthly":{"worked":"0","outbound":"","inbound":"","missed":"","duration":""}}}];

let worked = 0, outbound = 0, inbound = 0, missed = 0, duration = 0;
data.forEach((d: any) => {
  const pData = d.performance.monthly;
  const w = typeof pData.worked === 'string' ? parseFloat(pData.worked.replace(/[^0-9.-]+/g, "")) : pData.worked;
  const o = typeof pData.outbound === 'string' ? parseFloat(pData.outbound.replace(/[^0-9.-]+/g, "")) : pData.outbound;
  const i = typeof pData.inbound === 'string' ? parseFloat(pData.inbound.replace(/[^0-9.-]+/g, "")) : pData.inbound;
  const m = typeof pData.missed === 'string' ? parseFloat(pData.missed.replace(/[^0-9.-]+/g, "")) : pData.missed;
  
  if (!isNaN(w)) worked += w;
  if (!isNaN(o)) outbound += o;
  if (!isNaN(i)) inbound += i;
  if (!isNaN(m)) missed += m;
});

console.log({ worked, outbound, inbound, missed });
