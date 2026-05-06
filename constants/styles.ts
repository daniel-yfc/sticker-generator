import { StyleOption } from '../types';

export const STYLES: StyleOption[] = [
  {
    id: 1,
    style: "Flat Vector Art",
    basePrompt: "Professional Flat Vector Art. Crisp geometric shapes, Adobe Illustrator precision, clean bold outlines, vibrant solid color blocks, minimal cel-shading, high-end commercial graphic design.",
    modifiers: {
      person: "Stylized human anatomy, trendy minimalist outfit, simplified facial features, expressive flat character design, fashion illustration aesthetic.",
      object: "Isometric view, clean silhouettes, icon-like simplification, matte finish, studio lighting for products, commercial catalog style.",
      landscape: "Layered flat horizons, geometric clouds and trees, 2D depth perception, clean parallax layers, vibrant environmental vector."
    },
    previewColor: "bg-blue-500",
    iconName: "PenTool"
  },
  {
    id: 2,
    style: "Marker Illustration",
    basePrompt: "Professional Copic Marker Illustration. Saturated alcohol ink texture, heavy ink outlines, expressive hand-drawn strokes, sketchbook aesthetic, organic ink bleeding effects.",
    modifiers: {
      person: "Fashion sketch style, dynamic pose, emphasized shadow placement with marker layering, hand-drawn character charm.",
      object: "Product design sketch, reflective highlights, rough textures, artistic cross-hatching, industrial design aesthetic.",
      landscape: "Quick outdoor plein-air sketch, bleeding ink horizons, organic foliage clusters, atmospheric marker washes."
    },
    previewColor: "bg-orange-500",
    iconName: "Brush"
  },
  {
    id: 3,
    style: "Minimalist Flat Design",
    basePrompt: "Ultra-Minimalist Ligne Claire. Hergé aesthetic, uniform technical line weight, absolute flat pastel tints, zero gradients, zero shadows, architectural simplification.",
    modifiers: {
      person: "Elegant posture, clear-cut contours, minimal clothing folds, serene facial expressions, vintage European comic style.",
      object: "Clean technical drawing, simplified mechanical parts, uniform line art, clear functional form, blueprint aesthetic.",
      landscape: "Vast open spaces, clean architectural lines, rhythmic composition, serene and organized environment, minimalist nature."
    },
    previewColor: "bg-yellow-400",
    iconName: "Minimize"
  },
  {
    id: 4,
    style: "Risograph Print",
    basePrompt: "Authentic Risograph Print. Vibrant soy-based ink overlaps, visible halftone dot patterns, intentional color layer misregistration (CMYK offset), heavy grain texture.",
    modifiers: {
      person: "Dotted skin textures, pop-art character framing, retro fashion, stylized portrait with overlapping ink layers.",
      object: "Industrial object silhouettes, grainy metallic textures, vintage mechanical feel, limited palette product art.",
      landscape: "Grainy sky gradients, textured mountains, retro travel poster aesthetic, lo-fi environmental printing."
    },
    previewColor: "bg-pink-500",
    iconName: "Printer"
  },
  {
    id: 5,
    style: "3D Stylized Render",
    basePrompt: "High-End 3D Stylized Render. Disney-Pixar movie still, Octane Render, subsurface scattering, matte plastic toy finish, volumetric rim lighting, soft ambient occlusion.",
    modifiers: {
      person: "Big expressive eyes, soft skin shaders, high-quality hair grooming, cute character rig, cinematic facial expression.",
      object: "Tactile material details, studio product lighting, macro photography focus, satisfying rounded edges, toy-like premium finish.",
      landscape: "Miniature diorama style, tilt-shift effect, stylized environmental assets, magical lighting, toy-world terrain."
    },
    previewColor: "bg-red-500",
    iconName: "Box"
  },
  {
    id: 6,
    style: "Watercolor Illustration",
    basePrompt: "Traditional Watercolor Wash. Professional wet-on-wet technique, organic pigment blooms, artistic granulation, soft paint bleeds, 300gsm cold-press textured paper.",
    modifiers: {
      person: "Ethereal portrait, translucent skin tones, fluid clothing drapes, soft facial details, artistic ink-splattered accents.",
      object: "Organic object forms, soft edges, delicate pigment pooling, artistic representation of still life, dreamy textures.",
      landscape: "Misty horizons, blurred background mountains, artistic water reflections, atmospheric weather effects, fluid natural beauty."
    },
    previewColor: "bg-teal-400",
    iconName: "Droplet"
  },
  {
    id: 7,
    style: "Cyberpunk Mecha",
    basePrompt: "Cyberpunk Mecha-Core. Intricate robotic greeble details, glowing neon circuits, carbon fiber and brushed metal surfaces, futuristic HUD overlay, tactical sci-fi aesthetic.",
    modifiers: {
      person: "Cyborg enhancements, neural link ports, high-tech armor plating, glowing optical sensors, futuristic streetwear.",
      object: "Complex mechanical structure, internal circuitry visible, matte industrial coating, heavy-duty hardware, sci-fi gadgetry.",
      landscape: "Dystopian cityscape, neon-drenched rainy streets, towering megastructures, flying vehicles, high-tech industrial zone."
    },
    previewColor: "bg-slate-600",
    iconName: "Cpu"
  },
  {
    id: 8,
    style: "American Comic Art",
    basePrompt: "Modern Age American Comic. Aggressive black ink brushwork, dynamic foreshortening, Ben-Day dots shading, cinematic high-contrast lighting, bold primary palette.",
    modifiers: {
      person: "Muscular definition, heroic pose, dramatic facial shadows, action-oriented framing, iconic costume details.",
      object: "Impactful object lines, speed lines, high-contrast metallic sheen, 'larger than life' weapon or gadget design.",
      landscape: "Gothic city skylines, dramatic explosions, splash page composition, forced perspective streets, comic book panels."
    },
    previewColor: "bg-indigo-600",
    iconName: "Zap"
  },
  {
    id: 9,
    style: "Colored Pencil Sketch",
    basePrompt: "Detailed Colored Pencil Sketch. Prismacolor texture, dense cross-hatching, burnished wax finish, visible paper tooth, handcrafted warmth.",
    modifiers: {
      person: "Gentle portraiture, visible skin texture strokes, soft layered hair, intimate and realistic facial features.",
      object: "Waxy texture highlights, delicate color transitions, hand-drawn still life, realistic everyday objects with artistic touch.",
      landscape: "Soft rolling hills, meticulously sketched foliage, warm sunset gradients, textured natural scenery."
    },
    previewColor: "bg-amber-600",
    iconName: "Pencil"
  },
  {
    id: 10,
    style: "1930s Animation",
    basePrompt: "1930s Rubber Hose Animation. Fleischer Studios style, bouncy ink-blot characters, pie-cut eyes, vintage film grain and scratches, monochrome.",
    modifiers: {
      person: "Elastic limbs, white gloves, oversized shoes, rhythmic bouncing pose, exaggerated facial expressions.",
      object: "Anthropomorphic objects, items with faces and dancing limbs, rounded 'squash and stretch' form, vintage 1930s props.",
      landscape: "Surreal bouncing backgrounds, anthropomorphic trees and clouds, looping animation scenery, vintage theatre backdrop feel."
    },
    previewColor: "bg-gray-800",
    iconName: "Film"
  },
  {
    id: 11,
    style: "Noir Graphic Novel",
    basePrompt: "Noir Graphic Novel. Extreme Chiaroscuro lighting, stark ink silhouettes, heavy dramatic shadows, Sin City aesthetic, gritty urban atmosphere.",
    modifiers: {
      person: "Hard-boiled detective look, trench coat and fedora, face partially hidden in shadow, mysterious and stern gaze.",
      object: "Sharp metallic reflections in dark, dramatic silhouetted props, gritty textures, high-contrast monochrome product focus.",
      landscape: "Rain-slicked city streets, stark streetlamp lighting, deep alleyway shadows, cinematic urban claustrophobia."
    },
    previewColor: "bg-neutral-900",
    iconName: "Moon"
  },
  {
    id: 12,
    style: "Impasto Oil Painting",
    basePrompt: "Heavy Impasto Oil Painting. Thick palette knife strokes, rhythmic brush textures, vibrant color dabs, post-impressionist energy, museum-quality canvas relief.",
    modifiers: {
      person: "Textured skin tones, visible brushwork defining facial structure, expressive emotional aura, vibrant clothing textures.",
      object: "Three-dimensional paint volume, heavy texture on still life, rhythmic patterns of light, tactile artistic representation.",
      landscape: "Swirling skies, rhythmic fields of color, thick tactile mountains, shimmering water surfaces, vibrant natural energy."
    },
    previewColor: "bg-violet-600",
    iconName: "Palette"
  }
];

export const STYLES_MAP: Record<number, StyleOption> = STYLES.reduce((acc, style) => {
  acc[style.id] = style;
  return acc;
}, {} as Record<number, StyleOption>);
