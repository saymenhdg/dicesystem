import React, { useState } from 'react';
import { CreditCard, Wifi, Check } from 'lucide-react';

const OrderCardPage = ({ userData, cardDesigns, onOrderCard }) => {
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [cardType, setCardType] = useState('virtual');
  const [orderStep, setOrderStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!selectedDesign || orderStep !== 2 || !onOrderCard) return;
    const design = cardDesigns.find((d) => d.slug === selectedDesign);
    if (!design) return;

    setSubmitting(true);
    setError('');
    try {
      await onOrderCard({
        designSlug: design.slug,
        theme: design.gradient,
        cardType,
      });
    } catch (err) {
      setError(err?.message || 'Unable to place card order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Order a New Card</h2>
          <p className="text-gray-600">Choose your preferred card type and design</p>
        </div>

        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${orderStep >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${orderStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>1</div>
              <span className="font-medium">Card Type</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300" />
            <div className={`flex items-center space-x-2 ${orderStep >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${orderStep >= 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200'}`}>2</div>
              <span className="font-medium">Design</span>
            </div>
          </div>
        </div>

        {orderStep === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-gray-900">Select Card Type</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => setCardType('virtual')}
                className={`p-6 border-2 rounded-2xl transition-all ${cardType === 'virtual' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <CreditCard className="text-white" size={32} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Virtual Card</h4>
                    <p className="text-sm text-gray-600">Instant issuance - perfect for online shopping</p>
                  </div>
                  <span className="inline-block px-4 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">Free</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCardType('physical')}
                className={`p-6 border-2 rounded-2xl transition-all ${cardType === 'physical' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center">
                    <CreditCard className="text-white" size={32} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">Physical Card</h4>
                    <p className="text-sm text-gray-600">Delivered in 5-7 days - contactless enabled</p>
                  </div>
                  <span className="inline-block px-4 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">$5 Fee</span>
                </div>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setOrderStep(2)}
              className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-3 rounded-lg font-semibold hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg"
            >
              Continue to Design Selection
            </button>
          </div>
        )}

        {orderStep === 2 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Choose Card Design</h3>
              <button
                type="button"
                onClick={() => setOrderStep(1)}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                &lt; Back
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cardDesigns.map((design) => (
                <div key={design.slug} className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setSelectedDesign(design.slug)}
                    className={`w-full p-1 rounded-2xl transition-all ${
                      selectedDesign === design.slug ? 'ring-4 ring-indigo-600 ring-offset-2' : 'hover:ring-2 hover:ring-gray-300'
                    }`}
                  >
                    <div className={`relative w-full h-48 bg-gradient-to-br ${design.gradient} rounded-xl p-6 text-white shadow-xl`}>
                      {design.popular && (
                        <div className="absolute top-3 right-3">
                          <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">Popular</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/10 rounded-xl" />
                      <div className="relative h-full flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div className="text-xs opacity-80">DiceBank</div>
                          <Wifi size={24} className="opacity-80" />
                        </div>
                        <div>
                          <p className="text-base tracking-widest font-mono mb-3">**** **** **** 9010</p>
                          <div className="flex justify-between text-xs">
                            <span className="opacity-80">{(userData.name || '').toUpperCase()}</span>
                            <span>12/28</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                  <p className="text-center font-semibold text-gray-900">{design.name}</p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!selectedDesign || submitting}
              className={`w-full py-3 rounded-lg font-semibold transition-all shadow-lg ${
                selectedDesign && !submitting
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-700 hover:to-indigo-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {submitting ? 'Placing order...' : selectedDesign ? 'Order Card' : 'Select a design'}
            </button>
            {error ? <p className="text-sm text-red-600 text-center">{error}</p> : null}
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
        <h3 className="font-bold text-gray-900 mb-4">What You Get</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {['Instant Activation', 'Global Acceptance', 'Enhanced Security', 'Rewards Program'].map((label) => (
            <div key={label} className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Check size={14} className="text-white" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{label}</p>
                <p className="text-sm text-gray-600">
                  {label === 'Instant Activation'
                    ? 'Start using your card immediately after ordering'
                    : label === 'Global Acceptance'
                    ? 'Use your card at millions of locations worldwide'
                    : label === 'Enhanced Security'
                    ? 'Advanced fraud protection and secure transactions'
                    : 'Earn points and cashback on every purchase'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OrderCardPage;
