// Template starter files for different languages and frameworks

export interface TemplateFile {
  name: string
  path: string
  content: string
  language: string
}

export const templates: Record<string, TemplateFile[]> = {
  javascript: [
    {
      name: 'index.js',
      path: '/index.js',
      content: `console.log('Hello, World!');

// Your code here
`,
      language: 'javascript',
    },
    {
      name: 'package.json',
      path: '/package.json',
      content: `{
  "name": "my-project",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  }
}
`,
      language: 'json',
    },
  ],
  typescript: [
    {
      name: 'index.ts',
      path: '/index.ts',
      content: `console.log('Hello, World!');

// Your code here
`,
      language: 'typescript',
    },
    {
      name: 'tsconfig.json',
      path: '/tsconfig.json',
      content: `{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
`,
      language: 'json',
    },
    {
      name: 'package.json',
      path: '/package.json',
      content: `{
  "name": "my-project",
  "version": "1.0.0",
  "description": "",
  "main": "index.ts",
  "scripts": {
    "start": "ts-node index.ts",
    "build": "tsc"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0"
  }
}
`,
      language: 'json',
    },
  ],
  python: [
    {
      name: 'main.py',
      path: '/main.py',
      content: `def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
`,
      language: 'python',
    },
    {
      name: 'requirements.txt',
      path: '/requirements.txt',
      content: `# Add your dependencies here
`,
      language: 'plaintext',
    },
  ],
  go: [
    {
      name: 'main.go',
      path: '/main.go',
      content: `package main

import "fmt"

func main() {
    fmt.Println("Hello, World!")
}
`,
      language: 'go',
    },
    {
      name: 'go.mod',
      path: '/go.mod',
      content: `module myproject

go 1.21
`,
      language: 'plaintext',
    },
  ],
  rust: [
    {
      name: 'main.rs',
      path: '/src/main.rs',
      content: `fn main() {
    println!("Hello, World!");
}
`,
      language: 'rust',
    },
    {
      name: 'Cargo.toml',
      path: '/Cargo.toml',
      content: `[package]
name = "myproject"
version = "0.1.0"
edition = "2021"

[dependencies]
`,
      language: 'toml',
    },
  ],
  java: [
    {
      name: 'Main.java',
      path: '/src/Main.java',
      content: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
      language: 'java',
    },
  ],
}

export function getTemplateFiles(language: string): TemplateFile[] {
  return templates[language.toLowerCase()] || templates['javascript']
}
