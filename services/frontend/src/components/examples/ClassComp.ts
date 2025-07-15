import { Component } from "../../core/Component";
import { h } from "../../vdom/createElement";
import { VNode } from "../../types/global";


// ===== Example Class Components =====

export class CounterClassComponent extends Component<{ initialCount?: number }, { count: number; history: number[] }> {
  constructor(props: { initialCount?: number }) {
    super(props);
    this.state = {
      count: props.initialCount || 0,
      history: []
    };
  }

  // This render method returns VNodes directly - will trigger "hello Wrodl"
  render(): VNode {
    const { count, history } = this.state;
    
    return h('div', { className: 'counter-example p-6 bg-white rounded-lg shadow-lg' },
      h('h2', { className: 'text-2xl font-bold mb-4' }, 'Class Component Counter'),
      h('div', { className: 'text-center mb-4' },
        h('span', { className: 'text-4xl font-mono' }, count.toString())
      ),
      h('div', { className: 'flex gap-2 justify-center mb-4' },
        h('button', {
          onClick: () => this.increment(),
          className: 'px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600'
        }, '+'),
        h('button', {
          onClick: () => this.decrement(),
          className: 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600'
        }, '-'),
        h('button', {
          onClick: () => this.reset(),
          className: 'px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600'
        }, 'Reset')
      ),
      h('div', { className: 'text-sm text-gray-600' },
        h('p', null, `History: ${history.slice(-5).join(', ')}`),
        h('p', null, `Average: ${this.getAverage().toFixed(2)}`)
      )
    );
  }

  private increment(): void {
    this.setState({
      count: this.state.count + 1,
      history: [...this.state.history, this.state.count + 1]
    });
  }

  private decrement(): void {
    this.setState({
      count: this.state.count - 1,
      history: [...this.state.history, this.state.count - 1]
    });
  }

  private reset(): void {
    this.setState({
      count: 0,
      history: [...this.state.history, 0]
    });
  }

  private getAverage(): number {
    const { history } = this.state;
    return history.length > 0 ? 
      history.reduce((sum, val) => sum + val, 0) / history.length : 0;
  }
}