import React from 'react';
import { motion } from 'framer-motion';
import { Mail, MessageSquare, Send } from 'lucide-react';
import AnimatedSection from './AnimatedSection';

const Contact = () => {
  return (
    <AnimatedSection className="py-20 w-full">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-white">Get in Touch</h2>
            <p className="text-gray-300">
              Have a project in mind? Let's work together!
            </p>
          </div>
          
          <div className="bg-[#1E1A2C] rounded-2xl shadow-xl p-8 border border-violet-500/10">
            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">Name</label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 rounded-lg bg-[#13111C] border border-violet-500/10 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                    placeholder="vickymosafan"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-200">Email</label>
                  <input
                    type="email"
                    className="w-full px-4 py-3 rounded-lg bg-[#13111C] border border-violet-500/10 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                    placeholder="vickymosafan@example.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-200">Message</label>
                <textarea
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg bg-[#13111C] border border-violet-500/10 text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Your message here..."
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white rounded-lg font-medium flex items-center justify-center space-x-2 hover:opacity-90 transition-opacity"
              >
                <Send className="w-5 h-5" />
                <span>Send Message</span>
              </motion.button>
            </form>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-[#1E1A2C] rounded-xl border border-violet-500/10 flex items-center space-x-4"
            >
              <div className="p-3 bg-violet-500/10 rounded-full">
                <Mail className="w-6 h-6 text-violet-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Email</h3>
                <p className="text-gray-300">mvickymosafan@gmail.com</p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-[#1E1A2C] rounded-xl border border-violet-500/10 flex items-center space-x-4"
            >
              <div className="p-3 bg-fuchsia-500/10 rounded-full">
                <MessageSquare className="w-6 h-6 text-fuchsia-400" />
              </div>
              <div>
                <h3 className="font-medium text-white">Discord</h3>
                <p className="text-gray-300">vickymosafan</p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </AnimatedSection>
  );
};

export default Contact;