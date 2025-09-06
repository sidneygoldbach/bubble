# Jogo de Bolhas Coloridas 🫧

Um jogo estratégico de bolhas coloridas desenvolvido para Facebook, com mecânicas baseadas em cores, tamanhos e estratégia.

## 🎮 Como Jogar

### Objetivo
Estoure as bolhas coloridas tocando nelas antes que saiam da tela. Cada bolha tem um valor diferente baseado em sua cor e tamanho.

### Controles
- **Desktop**: Clique com o mouse nas bolhas
- **Mobile**: Toque nas bolhas com o dedo

### Sistema de Pontuação

#### Cores das Bolhas (do menor ao maior valor):
- 🔴 **Vermelho**: 10 pontos base
- 🔵 **Azul**: 15 pontos base
- 💙 **Azul Claro**: 20 pontos base
- 💚 **Verde**: 25 pontos base
- 💛 **Amarelo**: 30 pontos base
- 💜 **Roxo**: 35 pontos base
- 🧡 **Laranja**: 40 pontos base

#### Tamanhos das Bolhas:
- **Pequena**: 2x multiplicador (mais difícil, mais pontos)
- **Média**: 1.5x multiplicador
- **Grande**: 1x multiplicador
- **Extra Grande**: 0.5x multiplicador (mais fácil, menos pontos)

### 🎯 Estratégias Avançadas

#### Combo de Cores
- Estoure bolhas da mesma cor que estejam próximas (menos de 100 pixels)
- Cada bolha adicional no combo aumenta os pontos em 50%
- Som especial indica quando um combo é ativado

#### Bônus de Altura
- Bolhas estouradas mais alto na tela valem até 30% a mais
- Reaja rapidamente para maximizar os pontos

#### Penalidades
- Perda de 5 pontos por cada bolha que escapar pela parte superior
- Game over quando muitas bolhas se acumulam na parte superior

### 📈 Sistema de Níveis

- **Nível 1**: Bolhas aparecem a cada 2 segundos, máximo 15 bolhas
- **Nível 2+**: A cada 500 pontos, o nível aumenta
- **Progressão**: 
  - Bolhas aparecem mais rapidamente
  - Mais bolhas simultâneas na tela
  - Cores mais valiosas ficam disponíveis
  - Velocidade das bolhas aumenta

### 🔊 Efeitos Sonoros

- **Estouro Normal**: Tom baseado no valor da bolha
- **Combo**: Som especial de sequência
- **Level Up**: Melodia ascendente (C-E-G)
- **Game Over**: Tom descendente

## 🛠️ Recursos Técnicos

### Compatibilidade
- ✅ Dispositivos móveis (touch)
- ✅ Desktop (mouse)
- ✅ Navegadores modernos
- ✅ Facebook Canvas
- ✅ Responsivo

### Otimizações
- Canvas HTML5 para renderização suave
- Física realista com oscilação das bolhas
- Efeitos visuais de partículas
- Audio Context API para sons dinâmicos
- Gradientes animados no fundo

### Performance
- Limite inteligente de bolhas na tela
- Remoção automática de elementos fora da tela
- Animações otimizadas com requestAnimationFrame

## 🎨 Características Visuais

- **Design Glassmorphism**: Efeito de vidro fosco
- **Gradientes Dinâmicos**: Cores que mudam com o tempo
- **Sombras Realistas**: Profundidade visual
- **Brilhos nas Bolhas**: Efeito 3D convincente
- **Partículas de Explosão**: Feedback visual satisfatório

## 📱 Integração Facebook

- Meta tags Open Graph configuradas
- Interface otimizada para compartilhamento
- Responsivo para diferentes tamanhos de tela
- Touch events otimizados para mobile

## 🚀 Como Executar

1. Abra o arquivo `index.html` em um navegador
2. Ou hospede os arquivos em um servidor web
3. Para Facebook: faça upload para Facebook Canvas App

## 📁 Estrutura de Arquivos

```
bubble-game/
├── index.html      # Interface principal
├── game.js         # Lógica do jogo
└── README.md       # Este arquivo
```

## 🎯 Dicas para Pontuação Alta

1. **Priorize bolhas pequenas** - Valem mais pontos
2. **Busque combos de cores** - Multiplicador significativo
3. **Reaja rapidamente** - Bônus de altura
4. **Gerencie a tela** - Não deixe acumular bolhas
5. **Foque nas cores valiosas** - Laranja e roxo valem mais

Divirta-se estourando bolhas! 🎉