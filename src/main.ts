import { GameEngine } from './core/GameEngine';

const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement | null;

if (!canvas) {
  throw new Error('لم يُعثر على عنصر canvas#renderCanvas');
}

const game = new GameEngine(canvas);
game.begin();
