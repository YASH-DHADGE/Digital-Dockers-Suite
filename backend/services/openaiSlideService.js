const axios = require('axios');

const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';

// Theme color palettes
const THEME_COLORS = {
    dark: {
        backgrounds: ['#0f172a', '#1e1b4b', '#18181b', '#0c0a09', '#052e16'],
        text: '#f8fafc',
        accents: ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']
    },
    light: {
        backgrounds: ['#ffffff', '#f8fafc', '#faf5ff', '#f0fdf4', '#fffbeb'],
        text: '#1e293b',
        accents: ['#2563eb', '#7c3aed', '#0891b2', '#059669', '#d97706']
    },
    vibrant: {
        backgrounds: ['#7c3aed', '#db2777', '#0891b2', '#059669', '#ea580c'],
        text: '#ffffff',
        accents: ['#fbbf24', '#a3e635', '#38bdf8', '#f472b6', '#fb923c']
    }
};

// Style prompts
const STYLE_PROMPTS = {
    professional: 'Use formal, business-appropriate language. Clean and minimalist design. Focus on data and clear points.',
    creative: 'Be visually engaging and innovative. Use metaphors and creative storytelling. Bold design choices.',
    academic: 'Structured and research-focused. Include citations style. Methodical progression of ideas.',
    business: 'Executive summary style. Focus on ROI, metrics, and actionable insights. Professional but engaging.',
    startup: 'Dynamic and energetic. Focus on innovation, disruption, and growth potential. Modern and bold.'
};

/**
 * Generate a presentation using Mistral AI
 * @param {string} topic - The presentation topic
 * @param {number} slideCount - Number of slides (3-20)
 * @param {string} style - Presentation style
 * @param {string} theme - Color theme
 * @returns {Promise<Object>} Generated presentation object
 */
const generatePresentation = async (topic, slideCount, style, theme) => {
    const themeColors = THEME_COLORS[theme] || THEME_COLORS.dark;
    const stylePrompt = STYLE_PROMPTS[style] || STYLE_PROMPTS.professional;

    const systemPrompt = `You are a professional presentation designer and content strategist.
Your task is to create compelling, well-structured slide presentations.
You must output ONLY valid JSON, no markdown, no explanations, no code blocks.

Design principles:
- ${stylePrompt}
- Create a coherent narrative: introduction → body → conclusion
- Each slide should have a clear purpose
- Maximum 5 bullet points per slide
- Use consistent color palette based on theme
- Vary slide types appropriately (title, content, quote, conclusion)`;

    const userPrompt = `Create a ${slideCount}-slide presentation about: "${topic}"

Style: ${style}
Theme: ${theme}

Color palette to use:
- Background colors: ${themeColors.backgrounds.join(', ')}
- Text color: ${themeColors.text}
- Accent colors: ${themeColors.accents.join(', ')}

Output EXACTLY this JSON structure (no markdown, no code blocks, just raw JSON):
{
  "presentation": {
    "title": "Main presentation title",
    "slides": [
      {
        "id": "slide_1",
        "title": "Slide title",
        "subtitle": "Optional subtitle",
        "type": "title|content|quote|image|conclusion",
        "content": ["Bullet 1", "Bullet 2", "Bullet 3"],
        "backgroundColor": "#hex",
        "textColor": "#hex",
        "accentColor": "#hex",
        "layout": "center|left|split",
        "speaker_notes": "Optional presenter notes"
      }
    ]
  }
}

Requirements:
1. First slide MUST be type "title" with the main topic
2. Last slide MUST be type "conclusion" with key takeaways
3. Mix content types appropriately through the middle
4. Maximum 5 bullet points per slide
5. Use colors from the provided palette
6. Create exactly ${slideCount} slides
7. Output ONLY the JSON object, nothing else`;

    try {
        const response = await axios.post(
            MISTRAL_API_URL,
            {
                model: 'mistral-small-latest',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.7,
                max_tokens: 8000
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
                }
            }
        );

        let content = response.data.choices[0].message.content;

        // Clean up response - remove markdown code blocks if present
        content = content.trim();
        if (content.startsWith('```json')) {
            content = content.slice(7);
        }
        if (content.startsWith('```')) {
            content = content.slice(3);
        }
        if (content.endsWith('```')) {
            content = content.slice(0, -3);
        }
        content = content.trim();

        // Parse JSON
        const parsed = JSON.parse(content);

        if (!parsed.presentation || !parsed.presentation.slides) {
            throw new Error('Invalid presentation structure');
        }

        // Validate and normalize slides
        const slides = parsed.presentation.slides.map((slide, index) => ({
            id: slide.id || `slide_${index + 1}`,
            title: slide.title || 'Untitled Slide',
            subtitle: slide.subtitle || '',
            type: ['title', 'content', 'image', 'conclusion', 'quote'].includes(slide.type)
                ? slide.type
                : 'content',
            content: Array.isArray(slide.content) ? slide.content.slice(0, 5) : [],
            backgroundColor: slide.backgroundColor || themeColors.backgrounds[index % themeColors.backgrounds.length],
            textColor: slide.textColor || themeColors.text,
            accentColor: slide.accentColor || themeColors.accents[index % themeColors.accents.length],
            layout: ['center', 'left', 'split'].includes(slide.layout) ? slide.layout : 'center',
            imageUrl: slide.imageUrl || null,
            speaker_notes: slide.speaker_notes || ''
        }));

        return {
            title: parsed.presentation.title || topic,
            slides
        };

    } catch (error) {
        console.error('Mistral Slide Generation Error:', error.response?.data || error.message);

        if (error instanceof SyntaxError) {
            throw new Error('Failed to parse AI response. Please try again.');
        }

        throw new Error(error.response?.data?.message || error.message || 'Failed to generate presentation');
    }
};

module.exports = {
    generatePresentation
};
