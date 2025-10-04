import React, { useState } from 'react';
import { allBlogs } from '../data/blogs';
import { useLanguage } from '../context/LanguageContext';
import { BookOpen, Clock, Calendar, Search, Filter, ArrowRight } from 'lucide-react';

const Learn = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedBlog, setSelectedBlog] = useState(null);
  const { t, currentLanguage } = useLanguage();

  const categories = ['All', ...new Set(allBlogs.map(blog => blog.category))];

  const filteredBlogs = allBlogs.filter(blog => {
    const title = typeof blog.title === 'object' ? blog.title[currentLanguage] || blog.title.en : blog.title;
    const excerpt = typeof blog.excerpt === 'object' ? blog.excerpt[currentLanguage] || blog.excerpt.en : blog.excerpt;
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || blog.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (selectedBlog) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => setSelectedBlog(null)}
          className="mb-6 flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ArrowRight className="h-5 w-5 rotate-180" />
          <span>{t('backToArticles')}</span>
        </button>

        <article className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8">
          <div className="mb-6">
            <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-medium mb-4">
              {selectedBlog.category}
            </span>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {typeof selectedBlog.title === 'object' ? selectedBlog.title[currentLanguage] || selectedBlog.title.en : selectedBlog.title}
            </h1>
            <div className="flex items-center space-x-4 text-gray-600 dark:text-gray-400 text-sm">
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>{selectedBlog.date}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{selectedBlog.readTime}</span>
              </div>
            </div>
          </div>

          <div className="prose prose-lg dark:prose-invert max-w-none">
            {(typeof selectedBlog.content === 'object' ? selectedBlog.content[currentLanguage] || selectedBlog.content.en : selectedBlog.content).split('\n').map((line, index) => {
              if (line.startsWith('# ') && index === 0) {
                return null; // Skip the first H1 as it's already displayed in header
              } else if (line.startsWith('# ')) {
                return <h1 key={index} className="text-3xl font-bold mt-8 mb-4">{line.substring(2)}</h1>;
              } else if (line.startsWith('## ')) {
                return <h2 key={index} className="text-2xl font-semibold mt-6 mb-3">{line.substring(3)}</h2>;
              } else if (line.startsWith('### ')) {
                return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.substring(4)}</h3>;
              } else if (line.startsWith('- ')) {
                return <li key={index} className="ml-4">{line.substring(2)}</li>;
              } else if (line.match(/^\d+\./)) {
                return <li key={index} className="ml-4">{line}</li>;
              } else if (line.startsWith('**') && line.endsWith('**')) {
                return <p key={index} className="font-bold mb-2">{line.slice(2, -2)}</p>;
              } else if (line.trim() === '') {
                return <br key={index} />;
              } else {
                return <p key={index} className="mb-4">{line}</p>;
              }
            })}
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-xl mb-4">
          <BookOpen className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {t('learningHub')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Expand your cybersecurity knowledge with our comprehensive collection of articles, guides, and best practices.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('searchArticles')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none cursor-pointer"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Blog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredBlogs.map(blog => (
          <div
            key={blog.id}
            onClick={() => setSelectedBlog(blog)}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <div className="mb-4">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-medium mb-3">
                {blog.category}
              </span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
                {typeof blog.title === 'object' ? blog.title[currentLanguage] || blog.title.en : blog.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-3">
                {typeof blog.excerpt === 'object' ? blog.excerpt[currentLanguage] || blog.excerpt.en : blog.excerpt}
              </p>
            </div>
            
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-sm">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{blog.date}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{blog.readTime}</span>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        ))}
      </div>

      {filteredBlogs.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('noArticlesFound')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search terms or filters.
          </p>
        </div>
      )}
    </div>
  );
};

export default Learn;