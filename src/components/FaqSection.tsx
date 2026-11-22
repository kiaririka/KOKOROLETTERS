import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle, ChevronDown, ChevronUp, Search, Sparkles } from "lucide-react";
import faqsData from "../data/faqs.json";

interface FaqItem {
  id: string;
  category: string;
  question: string;
  answer: string;
}

export default function FaqSection() {
  const [faqs] = useState<FaqItem[]>(faqsData);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(faqs.map(item => item.category)))];

  const filteredFaqs = faqs.filter(item => {
    const matchesSearch = 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleFaq = (id: string) => {
    setOpenFaqId(prev => (prev === id ? null : id));
  };

  return (
    <div className="bg-ghibli-cream/40 rounded-3xl p-8 md:p-12 border border-ghibli-cream-dark/50 vintage-shadow space-y-8">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ghibli-green-light text-ghibli-green-dark text-[11px] font-semibold tracking-wide border border-ghibli-green/20">
          <HelpCircle className="w-3.5 h-3.5 text-ghibli-sage" />
          <span>Humble Guidance</span>
        </div>
        <h3 className="text-2xl md:text-3xl font-bold font-serif text-ghibli-green-dark">
          Frequently Answered Queries
        </h3>
        <p className="text-xs md:text-sm text-ghibli-sage leading-relaxed">
          Have a question about our slow-travel parchment mailings, seasonal botanical treats, or digital travel ledger? Explore our answers below.
        </p>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-ghibli-green-light/40 shadow-xs max-w-3xl mx-auto">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-ghibli-sage absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search our wisdom scroll..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-ghibli-cream/20 hover:bg-ghibli-cream/40 focus:bg-white rounded-xl border border-ghibli-green/30 text-xs focus:outline-none focus:ring-1 focus:ring-ghibli-green transition-all"
          />
        </div>

        {/* Categories Tab Pill */}
        <div className="flex flex-wrap gap-1.5 justify-center">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                activeCategory === cat
                  ? "bg-ghibli-green text-ghibli-green-dark font-semibold shadow-xs"
                  : "bg-transparent text-ghibli-sage hover:text-ghibli-green-dark hover:bg-ghibli-green-light/40"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion List */}
      <div className="max-w-3xl mx-auto space-y-3">
        <AnimatePresence initial={false}>
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <motion.div
                  key={faq.id}
                  layout
                  className="bg-white border border-ghibli-green-light/30 rounded-2xl overflow-hidden shadow-xs transition-colors hover:border-ghibli-green/40"
                >
                  <button
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full flex items-center justify-between p-5 text-left focus:outline-none"
                  >
                    <div className="space-y-1 pr-4">
                      <span className="text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full bg-ghibli-cream text-ghibli-sage font-semibold">
                        {faq.category}
                      </span>
                      <h4 className="font-serif font-semibold text-sm md:text-base text-ghibli-green-dark mt-1 flex items-center gap-1.5">
                        {faq.question}
                      </h4>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-ghibli-cream flex items-center justify-center text-ghibli-green-dark/70 shrink-0">
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                      >
                        <div className="px-5 pb-5 pt-1 text-xs md:text-sm text-ghibli-sage leading-relaxed border-t border-dashed border-ghibli-green-light/20 bg-ghibli-cream/10">
                          <p>{faq.answer}</p>
                          <div className="flex items-center gap-1 mt-3 text-[10px] text-ghibli-green-dark font-medium italic">
                            <Sparkles className="w-3 h-3 text-ghibli-cream-dark" />
                            <span>Handcrafted from our botanical sanctuary to your shelf.</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-12 bg-white border border-ghibli-green-light/30 rounded-2xl">
              <p className="text-xs text-ghibli-sage italic">No scrolls found matching your search. Try another query! 🍂</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
