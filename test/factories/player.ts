import { Factory } from 'rosie';
import Player from '../../src/player';

export default new Factory<Player>().sequence('id');
