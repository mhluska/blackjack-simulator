export default class PlayerInput {
  static readInput({ keypress = () => {}, click = () => {} } = {}) {
    throw new Error('Implement this');
  }
}
