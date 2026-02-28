/**
 * StateOfRochester Data Module
 * Fetches crisis meter and articles from CMS JSON/Markdown files
 */

// Fetch crisis meter data
async function fetchCrisisMeter() {
  try {
    const response = await fetch('_data/crisis-meter.json');
    if (!response.ok) throw new Error('Failed to fetch crisis meter');
    return await response.json();
  } catch (error) {
    console.error('Error fetching crisis meter:', error);
    // Return default values if fetch fails
    return {
      level: 50,
      label: 'Moderate',
      description: 'Loading crisis data...',
      updated_note: 'Unable to load data'
    };
  }
}

// Fetch all articles from _articles directory
async function fetchAllArticles() {
  try {
    // Fetch article list - we need to get all markdown files
    // Since we can't list directory contents, we'll fetch a manifest or all potential articles
    // For simplicity, we'll try common article files or use a listing approach
    
    // First, try to fetch an articles index if it exists
    const articles = [];
    
    // Try to fetch articles from a manifest or enumerate known articles
    // Since CMS creates individual files, we'll need to fetch them by name
    // For this implementation, we'll check for a common pattern
    
    // We'll fetch the article list from a JSON index if available
    // Otherwise, we'll return empty and let individual pages handle their content
    const response = await fetch('_data/articles.json').catch(() => null);
    
    if (response && response.ok) {
      const data = await response.json();
      return data.articles || [];
    }
    
    // If no index file, return empty array
    // Individual article pages will be loaded by slug
    return [];
  } catch (error) {
    console.error('Error fetching articles:', error);
    return [];
  }
}

// Fetch a single article by slug
async function fetchArticle(slug) {
  try {
    const response = await fetch(`_articles/${slug}.md`);
    if (!response.ok) {
      // Try with .markdown extension
      const altResponse = await fetch(`_articles/${slug}.markdown`);
      if (!altResponse.ok) throw new Error('Article not found');
      return await altResponse.text();
    }
    return await response.text();
  } catch (error) {
    console.error('Error fetching article:', error);
    return null;
  }
}

// Parse frontmatter from markdown content
// Simple frontmatter parser for YAML between --- delimiters
function parseFrontmatter(markdown) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
  const match = markdown.match(frontmatterRegex);
  
  if (!match) {
    return { 
      metadata: {}, 
      content: markdown 
    };
  }
  
  const frontmatter = match[1];
  const content = match[2];
  
  // Parse YAML-like frontmatter
  const metadata = {};
  const lines = frontmatter.split('\n');
  let currentKey = null;
  let currentValue = '';
  
  for (const line of lines) {
    const keyMatch = line.match(/^(\w+):\s*(.*)$/);
    if (keyMatch) {
      if (currentKey) {
        metadata[currentKey] = currentValue.trim();
      }
      currentKey = keyMatch[1];
      currentValue = keyMatch[2];
    } else if (currentKey && line.startsWith('  ')) {
      currentValue += ' ' + line.trim();
    }
  }
  if (currentKey) {
    metadata[currentKey] = currentValue.trim();
  }
  
  return { metadata, content };
}

// Get category display name from slug
function getCategoryDisplay(category) {
  const categories = {
    'safety': 'Safety',
    'schools': 'Schools',
    'neighborhoods': 'Neighborhoods',
    'events': 'Events',
    'health': 'Health',
    'infrastructure': 'Infrastructure',
    'city-hall': 'City Hall'
  };
  return categories[category] || category;
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

// Export functions for use in HTML
if (typeof window !== 'undefined') {
  window.StateOfRochester = {
    fetchCrisisMeter,
    fetchAllArticles,
    fetchArticle,
    parseFrontmatter,
    getCategoryDisplay,
    formatDate
  };
}
