import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// テスト用の簡単なコンポーネント
function TestComponent({ text }: { text: string }) {
  return <div data-testid="test-component">{text}</div>;
}

describe('Sample Test', () => {
  it('基本的なレンダリングテスト', () => {
    const testText = 'Hello, Test!';
    render(<TestComponent text={testText} />);

    const element = screen.getByTestId('test-component');
    expect(element).toBeInTheDocument();
    expect(element).toHaveTextContent(testText);
  });

  it('数学的な計算のテスト', () => {
    expect(1 + 1).toBe(2);
    expect(2 * 3).toBe(6);
  });
});
