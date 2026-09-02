// Add to SupportSection.tsx - Direct sale tracking
const SaleTracker = () => {
  const [customerName, setCustomerName] = useState('');
  const [product, setProduct] = useState('');
  const [amount, setAmount] = useState('');
  
  const recordSale = async () => {
    const sale = {
      id: Date.now().toString(),
      customerName,
      product,
      amount: parseFloat(amount),
      date: new Date().toLocaleDateString(),
      type: 'sale'
    };
    
    // Add to sales database
    await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sale)
    });
    
    // Clear form
    setCustomerName('');
    setProduct('');
    setAmount('');
    
    alert('Sale recorded successfully!');
  };
  
  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h4 className="font-bold mb-2">Record a Sale</h4>
      <div className="space-y-2">
        <input
          placeholder="Customer Name (optional)"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full px-2 py-1 border rounded"
        />
        <select
          value={product}
          onChange={(e) => setProduct(e.target.value)}
          className="w-full px-2 py-1 border rounded"
        >
          <option value="">Select Product</option>
          <option value="Zack Tippett Logo Tee">Zack Tippett Logo Tee</option>
          <option value="Tic & Talk Hoodie">Tic & Talk Hoodie</option>
        </select>
        <input
          type="number"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-2 py-1 border rounded"
        />
        <button 
          onClick={recordSale}
          className="w-full px-3 py-2 bg-primary text-primary-foreground rounded"
        >
          Record Sale
        </button>
      </div>
    </div>
  );
};
